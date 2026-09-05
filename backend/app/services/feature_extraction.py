"""
Aggregates per-packet data into per-source-IP traffic features.
Consumed by the Phase 3 detection engine.
"""
import pandas as pd

FEATURE_COLUMNS = [
    "src_ip", "packet_count", "total_bytes", "avg_packet_size",
    "unique_dst_ips", "unique_dst_ports", "duration_sec",
    "packet_rate", "first_seen", "last_seen",
]

MIN_DURATION_SEC = 0.001  # avoids divide-by-zero on near-instant bursts


def extract_source_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Groups packets by source IP and computes one feature row per source:

    - packet_count, total_bytes, avg_packet_size
    - unique_dst_ips, unique_dst_ports  (distinct destinations contacted)
    - duration_sec, packet_rate         (packets / second, epsilon-clamped)
    - first_seen, last_seen             (kept for alert evidence timestamps)
    """
    if df.empty:
        return pd.DataFrame(columns=FEATURE_COLUMNS)

    grouped = df.groupby("src_ip")

    features = grouped.agg(
        packet_count=("packet_size", "count"),
        total_bytes=("packet_size", "sum"),
        avg_packet_size=("packet_size", "mean"),
        unique_dst_ips=("dst_ip", "nunique"),
        unique_dst_ports=("dst_port", "nunique"),
        first_seen=("timestamp", "min"),
        last_seen=("timestamp", "max"),
    ).reset_index()

    features["duration_sec"] = (features["last_seen"] - features["first_seen"]).clip(lower=MIN_DURATION_SEC)
    features["packet_rate"] = features["packet_count"] / features["duration_sec"]

    return features[FEATURE_COLUMNS]