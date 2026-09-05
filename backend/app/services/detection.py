"""
Rule-based threat detection over per-source-IP traffic features.
Explainable by design: every alert carries the concrete evidence
(numbers) that triggered it, not a black-box score.

Thresholds below are starting points, not tuned against real attack
data. Expect to adjust them once you test against a real port-scan /
flood capture rather than a clean 26-packet baseline.
"""
from datetime import datetime, timezone
import pandas as pd

# --- Tunable thresholds -----------------------------------------------
PORT_SCAN_MIN_PORTS = 15          # unique dest ports from one source
PORT_SCAN_MAX_WINDOW_SEC = 30     # within this many seconds = more suspicious

DDOS_PACKET_RATE_THRESHOLD = 50   # packets/sec from a single source

EXFIL_BYTES_THRESHOLD = 2_000_000   # 2 MB from a single source
EXFIL_MAX_DEST_IPS = 2              # concentrated to few destinations
# ------------------------------------------------------------------------


def _severity_from_confidence(confidence: int) -> str:
    if confidence >= 80:
        return "High"
    if confidence >= 50:
        return "Medium"
    return "Low"


def _make_alert(threat_type, src_ip, confidence, evidence, dst_ip=None):
    return {
        "threat_type": threat_type,
        "severity": _severity_from_confidence(confidence),
        "confidence": confidence,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "src_ip": src_ip,
        "dst_ip": dst_ip,
        "evidence": evidence,
    }


def detect_port_scan(row: pd.Series) -> dict | None:
    ports = row["unique_dst_ports"]
    if ports < PORT_SCAN_MIN_PORTS:
        return None

    # Confidence scales with how far past threshold, capped at 98
    confidence = min(98, 50 + (ports - PORT_SCAN_MIN_PORTS) * 2)
    evidence = [
        f"Source contacted {ports} distinct destination ports",
        f"Activity spanned {row['duration_sec']:.1f} seconds",
    ]
    if row["duration_sec"] <= PORT_SCAN_MAX_WINDOW_SEC:
        evidence.append("Occurred within a short time window (typical of scanning tools)")
        confidence = min(98, confidence + 10)

    return _make_alert("Port Scan", row["src_ip"], confidence, evidence)


def detect_ddos(row: pd.Series) -> dict | None:
    if row["packet_count"] < DDOS_MIN_PACKET_COUNT:
        return None
    rate = row["packet_rate"]
    if rate < DDOS_PACKET_RATE_THRESHOLD:
        return None
    

    confidence = min(98, 50 + int((rate - DDOS_PACKET_RATE_THRESHOLD) / 2))
    evidence = [
        f"Source sent {row['packet_count']} packets over {row['duration_sec']:.1f}s",
        f"Sustained packet rate of {rate:.1f} packets/sec (threshold: {DDOS_PACKET_RATE_THRESHOLD})",
    ]
    return _make_alert("DDoS / Abnormal Traffic Volume", row["src_ip"], confidence, evidence)


def detect_exfiltration(row: pd.Series) -> dict | None:
    total_bytes = row["total_bytes"]
    dest_count = row["unique_dst_ips"]
    if total_bytes < EXFIL_BYTES_THRESHOLD or dest_count > EXFIL_MAX_DEST_IPS:
        return None

    confidence = min(95, 50 + int((total_bytes - EXFIL_BYTES_THRESHOLD) / 500_000))
    evidence = [
        f"{total_bytes / 1_000_000:.2f} MB transferred from a single source",
        f"Traffic concentrated to only {dest_count} destination IP(s)",
    ]
    return _make_alert("Suspicious Data Exfiltration", row["src_ip"], confidence, evidence)


def run_detection(features_df: pd.DataFrame) -> list[dict]:
    """
    Runs all detection rules against every source IP's feature row.
    Returns a flat list of alert dicts (empty list = no threats found).
    """
    if features_df.empty:
        return []

    alerts = []
    for _, row in features_df.iterrows():
        for detector in (detect_port_scan, detect_ddos, detect_exfiltration):
            alert = detector(row)
            if alert:
                alerts.append(alert)
    return alerts
# --- Tunable thresholds -----------------------------------------------
PORT_SCAN_MIN_PORTS = 15
PORT_SCAN_MAX_WINDOW_SEC = 30

DDOS_PACKET_RATE_THRESHOLD = 50
DDOS_MIN_PACKET_COUNT = 20        # NEW — don't judge rate off a handful of packets

EXFIL_BYTES_THRESHOLD = 2_000_000
EXFIL_MAX_DEST_IPS = 2
# ------------------------------------------------------------------------