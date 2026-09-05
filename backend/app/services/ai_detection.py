"""
Unsupervised anomaly detection over per-source traffic features.

Confidence is scaled relative to the current batch only — it means
"more anomalous than other sources in this capture," not a globally
calibrated probability. Below MIN_SAMPLES, the model refuses to run
rather than produce a statistically meaningless result.
"""
from sklearn.ensemble import IsolationForest
import pandas as pd

MODEL_NAME = "IsolationForest (unsupervised anomaly detection)"
MIN_SAMPLES = 5
FEATURE_COLUMNS = [
    "packet_count", "total_bytes", "avg_packet_size",
    "unique_dst_ips", "unique_dst_ports", "duration_sec", "packet_rate",
]
MIN_PACKET_COUNT = 20   # same floor as DDOS_MIN_PACKET_COUNT in detection.py —
                         # filters out low-sample sources whose stats (like
                         # packet_rate) are inflated by the duration-clamping
                         # artifact, before they ever reach the model.

def _explain(row: pd.Series, means: pd.Series, stds: pd.Series) -> str:
    z_scores = {}
    for col in FEATURE_COLUMNS:
        std = stds[col] if stds[col] > 0 else 1e-9
        z_scores[col] = (row[col] - means[col]) / std
    top = max(z_scores, key=lambda k: abs(z_scores[k]))
    z = z_scores[top]
    direction = "above" if z > 0 else "below"
    return (
        f"{top} is {abs(z):.1f} std deviations {direction} the group average "
        f"({row[top]:.2f} vs avg {means[top]:.2f})"
    )


def run_ai_detection(features: list[dict]) -> dict:
    df_all = pd.DataFrame(features)

    # Drop low-sample sources before training — their stats (especially
    # packet_rate) can be artifacts of duration-clamping, not real signal.
    # These are reported separately, not silently discarded.
    df = df_all[df_all["packet_count"] >= MIN_PACKET_COUNT].reset_index(drop=True)
    excluded = len(df_all) - len(df)

    if len(df) < MIN_SAMPLES:
        return {
            "model_name": MODEL_NAME,
            "model_status": (
                f"Insufficient data after filtering low-sample sources "
                f"(<{MIN_PACKET_COUNT} packets) — need at least {MIN_SAMPLES}, got {len(df)}"
                + (f". {excluded} source(s) excluded as low-sample." if excluded else "")
            ),
            "flows_analyzed": len(df),
            "anomalies_detected": 0,
            "anomalies": [],
        }

    X = df[FEATURE_COLUMNS].fillna(0)
    model = IsolationForest(contamination="auto", random_state=42)
    model.fit(X)

    scores = model.score_samples(X)   # higher = more normal
    predictions = model.predict(X)    # -1 = anomaly

    means, stds = X.mean(), X.std()
    min_s, max_s = scores.min(), scores.max()
    span = (max_s - min_s) or 1e-9

    anomalies = []
    for i, pred in enumerate(predictions):
        if pred != -1:
            continue
        confidence = int(round((1 - (scores[i] - min_s) / span) * 100))
        anomalies.append({
            "src_ip": df.iloc[i]["src_ip"],
            "anomaly_score": round(float(scores[i]), 4),
            "confidence": confidence,
            "explanation": _explain(X.iloc[i], means, stds),
        })

    anomalies.sort(key=lambda a: a["confidence"], reverse=True)

    return {
        "model_name": MODEL_NAME,
        "model_status": "Ready" + (f" — {excluded} low-sample source(s) excluded from analysis" if excluded else ""),
        "flows_analyzed": len(df),
        "anomalies_detected": len(anomalies),
        "anomalies": anomalies,
    }