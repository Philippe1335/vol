"use client";

import { useState, FormEvent } from "react";

type Props = {
  onAnalyze: (flightNumber: string) => void;
  loading: boolean;
};

const EXAMPLES = ["AC123", "WS456", "UA500", "AA100", "DL200"];

export default function FlightSearch({ onAnalyze, loading }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase().replace(/\s/g, "");
    if (trimmed) onAnalyze(trimmed);
  }

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ex: AC123, WS456, UA100..."
          className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyse...
            </span>
          ) : (
            "Analyser"
          )}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-slate-400 text-sm">Exemples:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => { setValue(ex); onAnalyze(ex); }}
            disabled={loading}
            className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-blue-300 transition disabled:opacity-40"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
