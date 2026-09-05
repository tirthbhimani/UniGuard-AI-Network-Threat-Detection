from fastapi import APIRouter
from app.services import live_capture
from app.models.schemas import InterfaceListResponse, MonitorActionResponse, LiveStats

router = APIRouter(prefix="/api/monitor", tags=["monitor"])


@router.get("/interfaces", response_model=InterfaceListResponse)
def get_interfaces():
    return InterfaceListResponse(interfaces=live_capture.list_interfaces())


@router.post("/start", response_model=MonitorActionResponse)
def start(interface: str | None = None):
    return MonitorActionResponse(**live_capture.start_monitoring(interface))


@router.post("/stop", response_model=MonitorActionResponse)
def stop():
    return MonitorActionResponse(**live_capture.stop_monitoring())


@router.get("/stats", response_model=LiveStats)
def stats():
    return live_capture.get_live_stats()


@router.get("/packets")
def recent_packets():
    return live_capture.get_recent_packets()


@router.get("/alerts")
def alerts():
    return live_capture.get_live_alerts()