import { useEffect, useState } from "react";
import { listAnalyses, runAIDetection } from "../api";
import type { AnalysisSummary, AIDetectionResult } from "../types";
import { runLiveAIDetection } from "../api";

export default function AIDetection() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAnalyses().then(setAnalyses).catch(() => {});
  }, []);

  async function handleRun() {
  if (!selectedId) return;
  setLoading(true);
  setError(null);
  try {
    const data = selectedId === "__live__" ? await runLiveAIDetection() : await runAIDetection(selectedId);
    setResult(data);
  } catch {
    setError("AI detection failed. If using Live Capture, confirm monitoring has run and captured traffic.");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">AI Detection</h2>
        <p className="text-slate-400 text-sm">
          Unsupervised anomaly detection — confidence is relative to the current capture, not a universal probability.
        </p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 flex-wrap">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select an analysis...</option>
          <option value="__live__">Live Capture (current session)</option>
          {analyses.map((a) => (
            <option key={a.analysis_id} value={a.analysis_id}>
              {a.filename} — {a.analyzed_at.slice(0, 19)}
            </option>
            
          ))}
        </select>
        <button
          onClick={handleRun}
          disabled={!selectedId || loading}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 transition-colors font-medium"
        >
          {loading ? "Running..." : "Run AI Detection"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">{error}</div>
      )}

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Model</p>
              <p className="text-sm font-semibold mt-1">{result.model_name}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Status</p>
              <p className="text-sm font-semibold mt-1">{result.model_status}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Flows Analyzed</p>
              <p className="text-2xl font-semibold mt-1">{result.flows_analyzed}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Anomalies Detected</p>
              <p className="text-2xl font-semibold mt-1">{result.anomalies_detected}</p>
            </div>
          </div>

          {result.anomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Anomalies</h3>
              {result.anomalies.map((a, i) => (
                <div key={i} className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="font-medium">{a.src_ip}</span>
                    <span className="text-amber-400 text-sm">{a.confidence}% confidence (relative)</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2">{a.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}