from pydantic import BaseModel
from typing import Optional


class AlertResponse(BaseModel):
    threat_type: str
    severity: str
    confidence: int
    timestamp: str
    src_ip: str
    dst_ip: Optional[str] = None
    evidence: list[str]


class TrafficStats(BaseModel):
    total_packets: int
    total_bytes: int
    protocol_counts: dict[str, int]
    top_source_ips: dict[str, int]


class AnalysisSummary(BaseModel):
    analysis_id: str
    filename: str
    total_packets: int
    total_bytes: int
    total_threats: int
    risk_level: str
    analyzed_at: str


class AnalysisResult(BaseModel):
    summary: AnalysisSummary
    alerts: list[AlertResponse]
    traffic_stats: TrafficStats
    
class InterfaceListResponse(BaseModel):
    interfaces: list[str]


class MonitorActionResponse(BaseModel):
    status: str
    interface: Optional[str] = None


class LiveStats(BaseModel):
    monitoring: bool
    interface: Optional[str] = None
    started_at: Optional[float] = None
    total_packets: int
    total_bytes: int
    packet_rate: float
    bandwidth_bytes_per_sec: float
    protocol_counts: dict[str, int]
    active_flows: int
    
class AIAnomaly(BaseModel):
    src_ip: str
    anomaly_score: float
    confidence: int
    explanation: str


class AIDetectionResponse(BaseModel):
    model_name: str
    model_status: str
    flows_analyzed: int
    anomalies_detected: int
    anomalies: list[AIAnomaly]