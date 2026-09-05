import { useEffect, useState } from "react";
import { listAnalyses, getAnalysis } from "../api";
import type { AnalysisSummary, Alert } from "../types";
import { getLiveAlerts } from "../api";

interface AlertWithSource extends Alert {
  source_file: string;
}

const severityColor: Record<string, string> = {
  High: "border-red-500/30 bg-red-500/5",
  Medium: "border-amber-500/30 bg-amber-500/5",
  Low: "border-yellow-500/30 bg-yellow-500/5",
};

export default function ThreatIntelligence() {
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [allAlerts, setAllAlerts] = useState<AlertWithSource[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  Promise.all([
    listAnalyses().then(async (summaries) => {
      setAnalyses(summaries);
      const results = await Promise.all(
        summaries.map((s) =>
          getAnalysis(s.analysis_id).then((full) =>
            full.alerts.map((a) => ({ ...a, source_file: s.filename }))
          )
        )
      );
      return results.flat();
    }),
    getLiveAlerts().then((live) => live.map((a) => ({ ...a, source_file: "Live Capture (current session)" }))),
  ]).then(([pcapAlerts, liveAlerts]) => {
    setAllAlerts([...pcapAlerts, ...liveAlerts]);
    setLoading(false);
  }).catch(() => setLoading(false));
}, []);

  const typeCounts: Record<string, number> = {};
  allAlerts.forEach((a) => {
    typeCounts[a.threat_type] = (typeCounts[a.threat_type] ?? 0) + 1;
  });

  const severityCounts: Record<string, number> = {};
  allAlerts.forEach((a) => {
    severityCounts[a.severity] = (severityCounts[a.severity] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Threat Intelligence</h2>
        <p className="text-slate-400 text-sm">Aggregated threats across all analyzed captures</p>
      </header>

      {loading ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : analyses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-400 text-sm">
          No analyses yet — run a PCAP analysis first.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Analyses Run</p>
              <p className="text-2xl font-semibold mt-1">{analyses.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Total Threats</p>
              <p className="text-2xl font-semibold mt-1">{allAlerts.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">High Severity</p>
              <p className="text-2xl font-semibold mt-1 text-red-400">{severityCounts["High"] ?? 0}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Threat Types</p>
              <p className="text-2xl font-semibold mt-1">{Object.keys(typeCounts).length}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-sm font-medium mb-3 text-slate-300">Threat Type Distribution</p>
            {Object.keys(typeCounts).length === 0 ? (
              <p className="text-slate-500 text-sm">No threats detected across any analysis.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-slate-300">{type}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">All Threat Alerts</h3>
            {allAlerts.length === 0 ? (
              <p className="text-slate-500 text-sm">No alerts recorded yet.</p>
            ) : (
              allAlerts.map((a, i) => (
                <details key={i} className={`border rounded-xl p-4 ${severityColor[a.severity]}`}>
                  <summary className="cursor-pointer flex justify-between items-start list-none">
                    <div>
                      <p className="font-semibold">{a.threat_type}</p>
                      <p className="text-xs opacity-70 mt-0.5">
                        {a.src_ip} {a.dst_ip ? `→ ${a.dst_ip}` : ""} · from {a.source_file}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase font-medium">{a.severity}</p>
                      <p className="text-xs opacity-70">{a.confidence}% confidence</p>
                    </div>
                  </summary>
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-xs uppercase text-slate-400 mb-2">Investigation Details</p>
                    <ul className="text-sm space-y-1 opacity-90">
                      {a.evidence.map((e, j) => (
                        <li key={j}>• {e}</li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-500 mt-3">
                      Detected: {new Date(a.timestamp).toLocaleString()}
                    </p>
                  </div>
                </details>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}