import type { AnalysisSummary } from "../types";

const riskColor: Record<string, string> = {
  High: "text-red-400 border-red-500/40",
  Medium: "text-amber-400 border-amber-500/40",
  Low: "text-yellow-300 border-yellow-500/40",
  None: "text-emerald-400 border-emerald-500/40",
};

export default function SummaryCards({ summary }: { summary: AnalysisSummary }) {
  const cards = [
    { label: "Total Packets", value: summary.total_packets.toLocaleString() },
    { label: "Traffic Volume", value: `${(summary.total_bytes / 1024).toFixed(1)} KB` },
    { label: "Threats Detected", value: summary.total_threats },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">{c.label}</p>
          <p className="text-2xl font-semibold mt-1">{c.value}</p>
        </div>
      ))}
      <div className={`bg-slate-900 border rounded-xl p-4 ${riskColor[summary.risk_level]}`}>
        <p className="text-xs uppercase tracking-wide opacity-80">Risk Level</p>
        <p className="text-2xl font-semibold mt-1">{summary.risk_level}</p>
      </div>
    </div>
  );
}