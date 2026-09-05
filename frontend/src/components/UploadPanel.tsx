import { useState } from "react";

interface Props {
  onUpload: (file: File) => void;
  loading: boolean;
}

export default function UploadPanel({ onUpload, loading }: Props) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-4">
      <input
        type="file"
        accept=".pcap,.pcapng"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:text-white file:cursor-pointer hover:file:bg-cyan-500"
      />
      <button
        disabled={!file || loading}
        onClick={() => file && onUpload(file)}
        className="px-4 py-2 rounded-lg bg-cyan-600 disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-cyan-500 transition-colors font-medium"
      >
        {loading ? "Analyzing..." : "Analyze Traffic"}
      </button>
    </div>
  );
}