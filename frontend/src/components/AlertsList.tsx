import type { Alert } from "../types";

const severityStyle: Record<string, string> = {
  High: "bg-red-500/10 text-red-400 border-red-500/30",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Low: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
};

export default function AlertsList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-400 text-sm">
        No threats detected in this capture.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((a, i) => (
        <details key={i} className={`border rounded-xl p-4 ${severityStyle[a.severity]}`}>
          <summary className="cursor-pointer flex justify-between items-start list-none">
            <div>
              <p className="font-semibold">{a.threat_type}</p>
              <p className="text-xs opacity-70 mt-0.5">
                {a.src_ip} {a.dst_ip ? `→ ${a.dst_ip}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-medium">{a.severity}</p>
              <p className="text-xs opacity-70">{a.confidence}% confidence</p>
            </div>
          </summary>
          <div className="mt-3 pt-3 border-t border-current/20">
            <p className="text-xs uppercase opacity-70 mb-2">Investigation Details</p>
            <ul className="text-sm space-y-1 opacity-90">
              {a.evidence.map((e, j) => (
                <li key={j}>• {e}</li>
              ))}
            </ul>
            <p className="text-xs opacity-60 mt-3">
              Detected: {new Date(a.timestamp).toLocaleString()}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}