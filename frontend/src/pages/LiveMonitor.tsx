import { useEffect, useRef, useState } from "react";
import {
  getInterfaces,
  startMonitoring,
  stopMonitoring,
  getLiveStats,
  getRecentPackets,
} from "../api";
import type { LiveStats } from "../types"; 
import type { LivePacket } from "../api";
import AlertsList from "../components/AlertsList";
import { getLiveAlerts } from "../api";
import type { Alert } from "../types";

function formatBandwidth(bytesPerSec: number): string {
  if (bytesPerSec > 1_000_000) return `${(bytesPerSec / 1_000_000).toFixed(2)} MB/s`;
  if (bytesPerSec > 1_000) return `${(bytesPerSec / 1_000).toFixed(1)} KB/s`;
  return `${bytesPerSec.toFixed(0)} B/s`;
}

export default function LiveMonitor() {
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selectedIface, setSelectedIface] = useState<string>("");
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [packets, setPackets] = useState<LivePacket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<number | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    getInterfaces()
      .then(setInterfaces)
      .catch(() => setError("Could not load network interfaces. Is the backend running?"));

    pollRef.current = window.setInterval(() => {
      getLiveStats().then(setStats).catch(() => {});
      getRecentPackets().then(setPackets).catch(() => {});
    }, 2000);

    getLiveAlerts().then(setLiveAlerts).catch(() => {});

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handleStart() {
    setBusy(true);
    setError(null);
    try {
      await startMonitoring(selectedIface || null);
      const s = await getLiveStats();
      setStats(s);
    } catch {
      setError("Failed to start monitoring. If this persists, confirm the backend is running as Administrator.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    setBusy(true);
    try {
      await stopMonitoring();
      const s = await getLiveStats();
      setStats(s);
    } finally {
      setBusy(false);
    }
  }

  const isMonitoring = stats?.monitoring ?? false;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold">Live Monitor</h2>
        <p className="text-slate-400 text-sm">
          Passive, read-only traffic monitoring — this tool never sends packets or probes to other devices.
        </p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 flex-wrap">
        <select
          value={selectedIface}
          onChange={(e) => setSelectedIface(e.target.value)}
          disabled={isMonitoring}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        >
          <option value="">Default interface</option>
          {interfaces.map((iface) => (
            <option key={iface} value={iface}>
              {iface}
            </option>
          ))}
        </select>

        {!isMonitoring ? (
          <button
            onClick={handleStart}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 transition-colors font-medium"
          >
            {busy ? "Starting..." : "Start Monitoring"}
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-slate-700 transition-colors font-medium"
          >
            {busy ? "Stopping..." : "Stop Monitoring"}
          </button>
        )}

        <span
          className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full border ${
            isMonitoring
              ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
              : "text-slate-400 border-slate-700 bg-slate-800"
          }`}
        >
          {isMonitoring ? "● LIVE — PASSIVE / READ-ONLY" : "STOPPED"}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Total Packets</p>
              <p className="text-2xl font-semibold mt-1">{stats.total_packets.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Packets / sec</p>
              <p className="text-2xl font-semibold mt-1">{stats.packet_rate.toFixed(1)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Bandwidth</p>
              <p className="text-2xl font-semibold mt-1">{formatBandwidth(stats.bandwidth_bytes_per_sec)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Active Flows</p>
              <p className="text-2xl font-semibold mt-1">{stats.active_flows}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-sm font-medium mb-3 text-slate-300">Protocol Breakdown</p>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(stats.protocol_counts).map(([proto, count]) => (
                <div key={proto} className="text-sm">
                  <span className="text-slate-400">{proto}:</span>{" "}
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-sm font-medium mb-3 text-slate-300">Live Packet Feed</p>
            {packets.length === 0 ? (
              <p className="text-slate-500 text-sm">No packets captured yet.</p>
            ) : (
              <div className="max-h-72 overflow-y-auto overflow-x-auto">
                <table className="w-full text-xs min-w-[500px]">
                  <thead className="text-slate-500 text-left sticky top-0 bg-slate-900">
                    <tr>
                      <th className="pb-1">Time</th>
                      <th className="pb-1">Protocol</th>
                      <th className="pb-1">Source</th>
                      <th className="pb-1">Destination</th>
                      <th className="pb-1">Size</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {[...packets].reverse().map((p, i) => (
                      <tr key={i} className="border-t border-slate-800">
                        <td className="py-1">{new Date(p.timestamp * 1000).toLocaleTimeString()}</td>
                        <td>{p.protocol}</td>
                        <td>
                          {p.src_ip}
                          {p.src_port ? `:${p.src_port}` : ""}
                        </td>
                        <td>
                          {p.dst_ip}
                          {p.dst_port ? `:${p.dst_port}` : ""}
                        </td>
                        <td>{p.size} B</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium mb-3 text-slate-300">Live Threat Alerts</p>
            <AlertsList alerts={liveAlerts} />
          </div>
        </>
      )}
    </div>
  );
}