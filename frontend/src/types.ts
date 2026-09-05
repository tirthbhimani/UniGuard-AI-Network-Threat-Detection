
export interface Alert {
  threat_type: string;
  severity: "High" | "Medium" | "Low";
  confidence: number;
  timestamp: string;
  src_ip: string;
  dst_ip: string | null;
  evidence: string[];
}

export interface AnalysisSummary {
  analysis_id: string;
  filename: string;
  total_packets: number;
  total_bytes: number;
  total_threats: number;
  risk_level: "High" | "Medium" | "Low" | "None";
  analyzed_at: string;
}

export interface TrafficStats {
  total_packets: number;
  total_bytes: number;
  protocol_counts: Record<string, number>;
  top_source_ips: Record<string, number>;
}

export interface AnalysisResult {
  summary: AnalysisSummary;
  alerts: Alert[];
  traffic_stats: TrafficStats;
}

export interface LiveStats {
  monitoring: boolean;
  interface: string | null;
  started_at: number | null;
  total_packets: number;
  total_bytes: number;
  packet_rate: number;
  bandwidth_bytes_per_sec: number;
  protocol_counts: Record<string, number>;
  active_flows: number;
}

export interface AIAnomaly {
  src_ip: string;
  anomaly_score: number;
  confidence: number;
  explanation: string;
}

export interface AIDetectionResult {
  model_name: string;
  model_status: string;
  flows_analyzed: number;
  anomalies_detected: number;
  anomalies: AIAnomaly[];
}