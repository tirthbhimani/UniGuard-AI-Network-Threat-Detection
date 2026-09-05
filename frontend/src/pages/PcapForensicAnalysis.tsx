import { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import SummaryCards from "../components/SummaryCards";
import AlertsList from "../components/AlertsList";
import TrafficCharts from "../components/TrafficCharts";
import { analyzePcap } from "../api";
import type { AnalysisResult } from "../types";

export default function PcapForensicAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzePcap(file);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Check the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">PCAP / Forensic Analysis</h2>
        <p className="text-slate-400 text-sm">Upload a capture file for offline threat analysis</p>
      </header>

      <UploadPanel onUpload={handleUpload} loading={loading} />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {result && (
        <>
          <SummaryCards summary={result.summary} />
          <TrafficCharts stats={result.traffic_stats} />
          <div>
            <h3 className="text-lg font-semibold mb-3">Threat Alerts</h3>
            <AlertsList alerts={result.alerts} />
          </div>
        </>
      )}
    </div>
  );
}