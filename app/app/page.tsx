"use client";

import { useState } from "react";
import FlightSearch from "@/components/FlightSearch";
import AnalysisReport from "@/components/AnalysisReport";

export type WeatherData = {
  description: string;
  wind_speed: number;
  visibility: number;
  temp: number;
  condition_id: number;
};

export type FlightData = {
  flight_number: string;
  airline: string;
  status: string;
  departure_airport: string;
  arrival_airport: string;
  scheduled_departure: string;
  actual_departure: string | null;
  departure_delay: number | null;
  cancellation_reason: string | null;
  aircraft_type: string | null;
};

export type AnalysisResult = {
  flight: FlightData | null;
  departure_weather: WeatherData | null;
  arrival_weather: WeatherData | null;
  faa_status: string | null;
  claimed_reason: string | null;
  verdict: "plausible" | "doubtful" | "suspicious" | "insufficient_data";
  confidence: number;
  explanation: string[];
  departure_airport_name: string;
  arrival_airport_name: string;
  demo_mode: boolean;
};

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(flightNumber: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/analyze?flight=${encodeURIComponent(flightNumber)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur serveur");
      }
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <div className="text-6xl mb-4">✈️</div>
          <h1 className="text-4xl font-bold mb-3">VériFlight</h1>
          <p className="text-blue-300 text-lg">
            Les compagnies aériennes disent-elles vraiment la vérité?
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Croise les données officielles avec météo, ATC et historiques de vols
          </p>
        </header>

        <FlightSearch onAnalyze={analyze} loading={loading} />

        {error && (
          <div className="mt-6 p-4 bg-red-900/40 border border-red-500/50 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {result && <AnalysisReport result={result} />}
      </div>
    </main>
  );
}
