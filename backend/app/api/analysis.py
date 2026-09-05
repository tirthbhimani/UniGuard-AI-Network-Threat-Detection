import uuid
import shutil
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.pcap_parser import parse_pcap
from app.services.feature_extraction import extract_source_features
from app.services.detection import run_detection
from app.services import storage
from app.models.schemas import AnalysisResult, AnalysisSummary, AlertResponse, TrafficStats

router = APIRouter(prefix="/api", tags=["analysis"])

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pcap", ".pcapng"}


def _compute_risk_level(alerts: list[dict]) -> str:
    if any(a["severity"] == "High" for a in alerts):
        return "High"
    if any(a["severity"] == "Medium" for a in alerts):
        return "Medium"
    if alerts:
        return "Low"
    return "None"


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_pcap(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Upload a .pcap or .pcapng file.")

    analysis_id = str(uuid.uuid4())
    saved_path = UPLOAD_DIR / f"{analysis_id}{ext}"

    with saved_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        df = parse_pcap(str(saved_path))
    except Exception as e:
        raise HTTPException(422, f"Could not parse PCAP file: {e}")

    if df.empty:
        raise HTTPException(422, "No IP packets found in the uploaded file.")

    features = extract_source_features(df)
    storage.save_features(analysis_id, features.to_dict("records"))
    alerts = run_detection(features)

    total_packets = len(df)
    total_bytes = int(df["packet_size"].sum())
    protocol_counts = df["protocol"].value_counts().to_dict()
    top_source_ips = df["src_ip"].value_counts().head(5).to_dict()

    summary = AnalysisSummary(
        analysis_id=analysis_id,
        filename=file.filename,
        total_packets=total_packets,
        total_bytes=total_bytes,
        total_threats=len(alerts),
        risk_level=_compute_risk_level(alerts),
        analyzed_at=datetime.now(timezone.utc).isoformat(),
    )

    result = AnalysisResult(
        summary=summary,
        alerts=[AlertResponse(**a) for a in alerts],
        traffic_stats=TrafficStats(
            total_packets=total_packets,
            total_bytes=total_bytes,
            protocol_counts=protocol_counts,
            top_source_ips=top_source_ips,
        ),
    )

    storage.save_result(analysis_id, result.model_dump())
    return result


@router.get("/analyze/{analysis_id}", response_model=AnalysisResult)
def get_analysis(analysis_id: str):
    result = storage.get_result(analysis_id)
    if result is None:
        raise HTTPException(404, "Analysis not found")
    return result


@router.get("/analyses")
def list_analyses():
    """Lightweight list for a 'recent analyses' view on the dashboard."""
    return [r["summary"] for r in storage.list_results()]