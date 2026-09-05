"""
Passive live packet capture.

READ-ONLY: this module only observes traffic via Scapy's sniff().
It never constructs, sends, or injects packets, and never contacts
other hosts. Nothing here performs scanning or probing of any kind.
"""
import threading
import time
from collections import deque
from scapy.all import sniff, get_if_list, IP, TCP, UDP, ICMP
import pandas as pd
from app.services.detection import run_detection

RECENT_PACKETS_MAX = 50   # same "keep it bounded" approach as NetWatch's 100-cap

RATE_WINDOW_SEC = 5       # window for packets-per-second / bandwidth calc
FLOW_TIMEOUT_SEC = 60     # a flow idle longer than this is dropped from "active"

_lock = threading.Lock()
_stop_event = threading.Event()
_capture_thread: threading.Thread | None = None

_state = {
    "monitoring": False,
    "interface": None,
    "started_at": None,
    "total_packets": 0,
    "total_bytes": 0,
    "protocol_counts": {},
    "recent_packets": deque(),
    "flows": {},
    "recent_packet_log": deque(maxlen=RECENT_PACKETS_MAX),
    "source_stats": {},
}


def list_interfaces() -> list[str]:
    return get_if_list()


def _flow_key(pkt) -> str:
    ip = pkt[IP]
    sport = dport = None
    if TCP in pkt:
        sport, dport = pkt[TCP].sport, pkt[TCP].dport
    elif UDP in pkt:
        sport, dport = pkt[UDP].sport, pkt[UDP].dport
    return f"{ip.src}:{sport}->{ip.dst}:{dport}"


def _process_packet(pkt):
    if IP not in pkt:
        return

    ip = pkt[IP]
    size = len(pkt)
    now = time.time()

    protocol = "OTHER"
    if TCP in pkt:
        protocol = "TCP"
    elif UDP in pkt:
        protocol = "UDP"
    elif ICMP in pkt:
        protocol = "ICMP"

    src_port = pkt[TCP].sport if TCP in pkt else (pkt[UDP].sport if UDP in pkt else None)
    dst_port = pkt[TCP].dport if TCP in pkt else (pkt[UDP].dport if UDP in pkt else None)

    with _lock:
        _state["total_packets"] += 1
        _state["total_bytes"] += size
        _state["protocol_counts"][protocol] = _state["protocol_counts"].get(protocol, 0) + 1

        _state["recent_packets"].append((now, size))

        _state["recent_packet_log"].append({
            "timestamp": now,
            "protocol": protocol,
            "src_ip": ip.src,
            "dst_ip": ip.dst,
            "src_port": src_port,
            "dst_port": dst_port,
            "size": size,
        })

        stats = _state["source_stats"].get(ip.src, {
            "packet_count": 0, "total_bytes": 0,
            "dst_ips": set(), "dst_ports": set(),
            "first_seen": now, "last_seen": now,
        })
        stats["packet_count"] += 1
        stats["total_bytes"] += size
        stats["dst_ips"].add(ip.dst)
        if dst_port is not None:
            stats["dst_ports"].add(dst_port)
        stats["last_seen"] = now
        _state["source_stats"][ip.src] = stats

        cutoff = now - RATE_WINDOW_SEC
        while _state["recent_packets"] and _state["recent_packets"][0][0] < cutoff:
            _state["recent_packets"].popleft()

        key = _flow_key(pkt)
        flow = _state["flows"].get(key, {"packets": 0, "bytes": 0, "protocol": protocol})
        flow["packets"] += 1
        flow["bytes"] += size
        flow["protocol"] = protocol
        flow["last_seen"] = now
        _state["flows"][key] = flow


def _prune_stale_flows():
    now = time.time()
    with _lock:
        stale = [k for k, f in _state["flows"].items() if now - f["last_seen"] > FLOW_TIMEOUT_SEC]
        for k in stale:
            del _state["flows"][k]


def _run_capture(interface: str | None):
    sniff(
        iface=interface,
        prn=_process_packet,
        store=False,
        stop_filter=lambda pkt: _stop_event.is_set(),
    )


def start_monitoring(interface: str | None) -> dict:
    global _capture_thread
    with _lock:
        if _state["monitoring"]:
            return {"status": "already_running", "interface": _state["interface"]}
        _stop_event.clear()
        _state.update({
            "monitoring": True,
            "interface": interface,
            "started_at": time.time(),
            "total_packets": 0,
            "total_bytes": 0,
            "protocol_counts": {},
            "recent_packets": deque(),
            "flows": {},
            "source_stats": {},
        })

    _capture_thread = threading.Thread(target=_run_capture, args=(interface,), daemon=True)
    _capture_thread.start()
    return {"status": "started", "interface": interface}


def stop_monitoring() -> dict:
    with _lock:
        if not _state["monitoring"]:
            return {"status": "not_running"}
    _stop_event.set()
    if _capture_thread:
        _capture_thread.join(timeout=3)
    with _lock:
        _state["monitoring"] = False
    return {"status": "stopped"}


def _build_source_feature_rows() -> list[dict]:
    with _lock:
        snapshot = {k: dict(v) for k, v in _state["source_stats"].items()}

    rows = []
    for src_ip, s in snapshot.items():
        duration = max(s["last_seen"] - s["first_seen"], 0.001)
        pc = s["packet_count"]
        rows.append({
            "src_ip": src_ip,
            "packet_count": pc,
            "total_bytes": s["total_bytes"],
            "avg_packet_size": s["total_bytes"] / pc if pc else 0,
            "unique_dst_ips": len(s["dst_ips"]),
            "unique_dst_ports": len(s["dst_ports"]),
            "duration_sec": duration,
            "packet_rate": pc / duration,
            "first_seen": s["first_seen"],
            "last_seen": s["last_seen"],
        })
    return rows


def get_live_features() -> list[dict]:
    """Same feature shape as PCAP analysis, built from live source_stats."""
    return _build_source_feature_rows()


def get_live_alerts() -> list[dict]:
    rows = _build_source_feature_rows()
    if not rows:
        return []
    df = pd.DataFrame(rows)
    return run_detection(df)

def get_live_stats() -> dict:
    _prune_stale_flows()
    with _lock:
        recent = list(_state["recent_packets"])
        window_bytes = sum(size for _, size in recent)
        packet_rate = len(recent) / RATE_WINDOW_SEC if recent else 0.0
        bandwidth_bps = window_bytes / RATE_WINDOW_SEC if recent else 0.0

        return {
            "monitoring": _state["monitoring"],
            "interface": _state["interface"],
            "started_at": _state["started_at"],
            "total_packets": _state["total_packets"],
            "total_bytes": _state["total_bytes"],
            "packet_rate": round(packet_rate, 2),
            "bandwidth_bytes_per_sec": round(bandwidth_bps, 2),
            "protocol_counts": dict(_state["protocol_counts"]),
            "active_flows": len(_state["flows"]),
        }

def get_recent_packets() -> list[dict]:
    with _lock:
        return list(_state["recent_packet_log"])


def get_live_alerts() -> list[dict]:
    with _lock:
        snapshot = {k: dict(v) for k, v in _state["source_stats"].items()}

    if not snapshot:
        return []

    rows = []
    for src_ip, s in snapshot.items():
        duration = max(s["last_seen"] - s["first_seen"], 0.001)
        pc = s["packet_count"]
        rows.append({
            "src_ip": src_ip,
            "packet_count": pc,
            "total_bytes": s["total_bytes"],
            "avg_packet_size": s["total_bytes"] / pc if pc else 0,
            "unique_dst_ips": len(s["dst_ips"]),
            "unique_dst_ports": len(s["dst_ports"]),
            "duration_sec": duration,
            "packet_rate": pc / duration,
            "first_seen": s["first_seen"],
            "last_seen": s["last_seen"],
        })

    df = pd.DataFrame(rows)
    return run_detection(df)