import axios from "axios";
import type { AnalysisResult } from "./types.ts";
import type { LiveStats } from "./types";
import type { AIDetectionResult } from "./types";
import type { AnalysisSummary} from "./types";
import type { Alert }  from "./types";

export async function runAIDetection(analysisId: string): Promise<AIDetectionResult> {
  const res = await axios.post<AIDetectionResult>(`${API_BASE}/api/ai/analyze/${analysisId}`);
  return res.data;
}

export async function runLiveAIDetection(): Promise<AIDetectionResult> {
  const res = await axios.post<AIDetectionResult>(`${API_BASE}/api/ai/analyze-live`);
  return res.data;
}
const API_BASE = "http://localhost:8000";

export async function analyzePcap(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post<AnalysisResult>(`${API_BASE}/api/analyze`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
export async function getInterfaces(): Promise<string[]> {
  const res = await axios.get<{ interfaces: string[] }>(`${API_BASE}/api/monitor/interfaces`);
  return res.data.interfaces;
}

export async function startMonitoring(iface: string | null): Promise<void> {
  await axios.post(`${API_BASE}/api/monitor/start`, null, {
    params: iface ? { interface: iface } : {},
  });
}

export async function stopMonitoring(): Promise<void> {
  await axios.post(`${API_BASE}/api/monitor/stop`);
}

export async function getLiveStats(): Promise<LiveStats> {
  const res = await axios.get<LiveStats>(`${API_BASE}/api/monitor/stats`);
  return res.data;
}


export async function listAnalyses(): Promise<AnalysisSummary[]> {
  const res = await axios.get<AnalysisSummary[]>(`${API_BASE}/api/analyses`);
  return res.data;
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  const res = await axios.get<AnalysisResult>(`${API_BASE}/api/analyze/${id}`);
  return res.data;
}

export interface LivePacket {
  timestamp: number;
  protocol: string;
  src_ip: string;
  dst_ip: string;
  src_port: number | null;
  dst_port: number | null;
  size: number;
}

export async function getRecentPackets(): Promise<LivePacket[]> {
  const res = await axios.get<LivePacket[]>(`${API_BASE}/api/monitor/packets`);
  return res.data;
}

export async function getLiveAlerts(): Promise<Alert[]> {
  const res = await axios.get<Alert[]>(`${API_BASE}/api/monitor/alerts`);
  return res.data;
}

