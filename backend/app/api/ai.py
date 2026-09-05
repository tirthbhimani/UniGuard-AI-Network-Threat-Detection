from fastapi import APIRouter, HTTPException
from app.services import ai_detection, storage
from app.models.schemas import AIDetectionResponse

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/status")
def status():
    return {
        "model_name": ai_detection.MODEL_NAME,
        "model_status": "Idle — select a completed analysis to run detection",
    }


@router.post("/analyze/{analysis_id}", response_model=AIDetectionResponse)
def analyze(analysis_id: str):
    features = storage.get_features(analysis_id)
    if features is None:
        raise HTTPException(404, "No stored features for this analysis. Re-run the PCAP analysis first.")
    return ai_detection.run_ai_detection(features)

from app.services import live_capture

@router.post("/analyze-live", response_model=AIDetectionResponse)
def analyze_live():
    features = live_capture.get_live_features()
    if not features:
        raise HTTPException(400, "No live traffic captured yet. Start monitoring first.")
    return ai_detection.run_ai_detection(features)