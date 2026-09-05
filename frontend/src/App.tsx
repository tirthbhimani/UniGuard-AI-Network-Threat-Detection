import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import OverviewDashboard from "./pages/OverviewDashboard";
import LiveMonitor from "./pages/LiveMonitor";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import AIDetection from "./pages/AIDetection";
import PcapForensicAnalysis from "./pages/PcapForensicAnalysis";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<OverviewDashboard />} />
          <Route path="live-monitor" element={<LiveMonitor />} />
          <Route path="threat-intelligence" element={<ThreatIntelligence />} />
          <Route path="ai-detection" element={<AIDetection />} />
          <Route path="pcap-analysis" element={<PcapForensicAnalysis />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}