"""
Parses PCAP files into a flat per-packet DataFrame.
Uses Scapy's rdpcap for offline, read-only parsing — no live capture,
matches the "passive analysis" requirement.
"""
from scapy.all import rdpcap, IP, TCP, UDP, ICMP
import pandas as pd

COLUMNS = ["timestamp", "src_ip", "dst_ip", "src_port", "dst_port", "protocol", "packet_size"]


def parse_pcap(file_path: str) -> pd.DataFrame:
    """
    Reads a PCAP file and extracts one row per IP packet.
    Non-IP packets (ARP, etc.) are skipped for the MVP.
    """
    packets = rdpcap(file_path)
    records = []

    for pkt in packets:
        if IP not in pkt:
            continue

        src_port = None
        dst_port = None
        protocol = "OTHER"

        if TCP in pkt:
            protocol = "TCP"
            src_port = pkt[TCP].sport
            dst_port = pkt[TCP].dport
        elif UDP in pkt:
            protocol = "UDP"
            src_port = pkt[UDP].sport
            dst_port = pkt[UDP].dport
        elif ICMP in pkt:
            protocol = "ICMP"

        records.append({
            "timestamp": float(pkt.time),
            "src_ip": pkt[IP].src,
            "dst_ip": pkt[IP].dst,
            "src_port": src_port,
            "dst_port": dst_port,
            "protocol": protocol,
            "packet_size": len(pkt),
        })

    df = pd.DataFrame(records, columns=COLUMNS)
    df.sort_values("timestamp", inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df