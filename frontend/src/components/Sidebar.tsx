import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Overview Dashboard" },
  { to: "/live-monitor", label: "Live Monitor" },
  { to: "/threat-intelligence", label: "Threat Intelligence" },
  { to: "/ai-detection", label: "AI Detection" },
  { to: "/pcap-analysis", label: "PCAP / Forensic Analysis" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen p-4 flex-shrink-0">
      <h1 className="text-lg font-bold mb-1">UniGuard</h1>
      <p className="text-xs text-slate-500 mb-6">Passive network threat detection</p>
      <nav className="space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-cyan-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}