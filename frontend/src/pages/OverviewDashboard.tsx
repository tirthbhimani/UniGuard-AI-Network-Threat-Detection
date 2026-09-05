import { useEffect, useState } from "react";
import { getLiveStats, listAnalyses, getAnalysis } from "../api";
import type { LiveStats, AnalysisSummary, Alert } from "../types";

const riskColor: Record<string, string> = {
  High: "text-red-400 border-red-500/40",
  Medium: "text-amber-400 border-amber-500/40",
  Low: "text-yellow-300 border-yellow-500/40",
  None: "text-emerald-400 border-emerald-500/40",
};

export default function OverviewDashboard() {
  const [live, setLive] = useState<LiveStats | null>(null);
  const [latest, setLatest] = useState<AnalysisSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const poll = () => getLiveStats().then(setLive).catch(() => {});
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    listAnalyses().then((all) => {
      if (all.length === 0) return;
      const mostRecent = [...all].sort((a, b) => b.analyzed_at.localeCompare(a.analyzed_at))[0];
      setLatest(mostRecent);
      getAnalysis(mostRecent.analysis_id).then((full) => setAlerts(full.alerts));
    }).catch(() => {});
  }, []);

  const riskLevel = latest?.risk_level ?? "None";
  const threatCounts: Record<string, number> = {};
  alerts.forEach((a) => {
    threatCounts[a.threat_type] = (threatCounts[a.threat_type] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Overview Dashboard</h2>
        <p className="text-slate-400 text-sm">Live monitoring status and most recent analysis</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Monitoring Status</p>
          <p className={`text-xl font-semibold mt-1 ${live?.monitoring ? "text-emerald-400" : "text-slate-400"}`}>
            {live?.monitoring ? "LIVE" : "STOPPED"}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Mode</p>
          <p className="text-xl font-semibold mt-1 text-cyan-400">PASSIVE / READ-ONLY</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Total Packets (live)</p>
          <p className="text-xl font-semibold mt-1">{live?.total_packets.toLocaleString() ?? "—"}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Active Flows</p>
          <p className="text-xl font-semibold mt-1">{live?.active_flows ?? "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Traffic Rate</p>
          <p className="text-xl font-semibold mt-1">{live ? `${live.packet_rate.toFixed(1)} pkt/s` : "—"}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Threats (last analysis)</p>
          <p className="text-xl font-semibold mt-1">{latest?.total_threats ?? 0}</p>
        </div>
        <div className={`bg-slate-900 border rounded-xl p-4 col-span-2 ${riskColor[riskLevel]}`}>
          <p className="text-xs uppercase tracking-wide opacity-80">Current Risk Level</p>
          <p className="text-xl font-semibold mt-1">{riskLevel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm font-medium mb-3 text-slate-300">Threat Distribution (last analysis)</p>
          {Object.keys(threatCounts).length === 0 ? (
            <p className="text-slate-500 text-sm">No threats in the most recent analysis.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(threatCounts).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-slate-300">{type}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-sm font-medium mb-3 text-slate-300">Recent Threat Alerts</p>
          {alerts.length === 0 ? (
            <p className="text-slate-500 text-sm">No alerts to show. Run a PCAP analysis first.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.slice(0, 5).map((a, i) => (
                <div key={i} className="text-sm border-b border-slate-800 pb-2">
                  <span className="font-medium">{a.threat_type}</span>{" "}
                  <span className="text-slate-500">— {a.src_ip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!latest && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-400 text-sm">
          No PCAP analysis run yet — visit "PCAP / Forensic Analysis" to upload a capture.
        </div>
      )}
    </div>
  );
}