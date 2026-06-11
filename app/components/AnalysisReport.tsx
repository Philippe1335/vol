"use client";

import type { AnalysisResult, WeatherData } from "@/app/page";
import CompensationCard from "@/components/CompensationCard";

type Props = { result: AnalysisResult };

const VERDICT_CONFIG = {
  plausible: {
    color: "text-green-400",
    bg: "bg-green-900/30 border-green-500/40",
    icon: "✅",
    label: "Raison plausible",
    desc: "Les données externes confirment la version de la compagnie.",
  },
  doubtful: {
    color: "text-yellow-400",
    bg: "bg-yellow-900/30 border-yellow-500/40",
    icon: "⚠️",
    label: "Raison douteuse",
    desc: "Les données disponibles ne confirment pas clairement la raison.",
  },
  suspicious: {
    color: "text-orange-400",
    bg: "bg-orange-900/30 border-orange-500/40",
    icon: "🚨",
    label: "Raison suspecte",
    desc: "Les données contredisent la raison donnée par la compagnie.",
  },
  insufficient_data: {
    color: "text-slate-400",
    bg: "bg-slate-800/50 border-slate-500/40",
    icon: "❓",
    label: "Données insuffisantes",
    desc: "Impossible de confirmer ou infirmer avec les données disponibles.",
  },
};

const REASON_LABELS: Record<string, string> = {
  weather: "Météo",
  technical: "Panne technique",
  crew: "Problème d'équipage",
  traffic: "Contrôle aérien (ATC)",
  security: "Sécurité",
  other: "Autre",
};

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 70 ? "bg-green-500" : value >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-mono w-10 text-right">{value}%</span>
    </div>
  );
}

function WeatherCard({ label, iata, name, weather }: {
  label: string;
  iata: string;
  name: string;
  weather: WeatherData | null;
}) {
  if (!weather) {
    return (
      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="font-semibold mt-1">{name || iata}</p>
        <p className="text-slate-400 text-sm mt-2">Données météo non disponibles</p>
      </div>
    );
  }

  const windKmh = Math.round(weather.wind_speed * 3.6);
  const visKm = (weather.visibility / 1000).toFixed(1);

  return (
    <div className="bg-white/5 rounded-xl p-4">
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-semibold mt-1">{name || iata}</p>
      <p className="text-blue-300 text-sm mt-1 capitalize">{weather.description}</p>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div>
          <p className="text-xs text-slate-400">Temp</p>
          <p className="font-mono text-sm">{Math.round(weather.temp)}°C</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Vent</p>
          <p className="font-mono text-sm">{windKmh} km/h</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Visib.</p>
          <p className="font-mono text-sm">{visKm} km</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisReport({ result }: Props) {
  const vc = VERDICT_CONFIG[result.verdict];
  const flight = result.flight;

  return (
    <div className="mt-8 space-y-4">
      {result.demo_mode && (
        <div className="p-3 bg-amber-900/30 border border-amber-500/40 rounded-xl text-amber-300 text-sm">
          ⚠️ <strong>Mode démonstration</strong> — Configurez vos clés API dans <code>.env.local</code> pour des données réelles.
        </div>
      )}

      {/* Verdict principal */}
      <div className={`p-6 border rounded-2xl ${vc.bg}`}>
        <div className="flex items-start gap-4">
          <span className="text-4xl">{vc.icon}</span>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${vc.color}`}>{vc.label}</h2>
            <p className="text-slate-300 mt-1">{vc.desc}</p>
            <div className="mt-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Niveau de confiance</span>
              <ConfidenceBar value={result.confidence} />
            </div>
          </div>
        </div>
      </div>

      {/* Info vol */}
      {flight && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Informations du vol</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Vol</p>
              <p className="font-bold text-lg">{flight.flight_number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Compagnie</p>
              <p className="font-semibold text-sm">{flight.airline}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Statut</p>
              <p className={`font-semibold text-sm capitalize ${
                flight.status === "cancelled" ? "text-red-400" :
                flight.status === "active" ? "text-green-400" : "text-yellow-400"
              }`}>{flight.status}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Raison invoquée</p>
              <p className="font-semibold text-sm text-blue-300">
                {result.claimed_reason ? REASON_LABELS[result.claimed_reason] ?? result.claimed_reason : "Non fournie"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="font-bold text-lg">{flight.departure_airport}</span>
            <span className="text-slate-400 flex-1 border-t border-dashed border-slate-600 mx-2" />
            <span className="font-bold text-lg">{flight.arrival_airport}</span>
          </div>
          {flight.departure_delay != null && flight.departure_delay > 0 && (
            <p className="mt-2 text-yellow-400 text-sm">Retard: {flight.departure_delay} min</p>
          )}
        </div>
      )}

      {/* Météo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WeatherCard
          label="Météo — Départ"
          iata={flight?.departure_airport ?? ""}
          name={result.departure_airport_name}
          weather={result.departure_weather}
        />
        <WeatherCard
          label="Météo — Arrivée"
          iata={flight?.arrival_airport ?? ""}
          name={result.arrival_airport_name}
          weather={result.arrival_weather}
        />
      </div>

      {/* ATC / FAA */}
      {result.faa_status && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Statut ATC (FAA)</p>
          <p className="text-blue-300 text-sm">{result.faa_status}</p>
        </div>
      )}

      {/* Compensation */}
      {result.compensation && (
        <CompensationCard compensation={result.compensation} />
      )}

      {/* Analyse détaillée */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm uppercase tracking-wider text-slate-400 mb-3">Analyse détaillée</h3>
        <ul className="space-y-2">
          {result.explanation.map((line, i) => (
            <li key={i} className="text-sm text-slate-300 font-mono">{line}</li>
          ))}
        </ul>
      </div>

      {/* Sources */}
      <div className="text-xs text-slate-500 text-center space-y-1 pt-2">
        <p>Sources: AviationStack · OpenWeatherMap · FAA NASSTATUS</p>
        <p>Les données météo sont en temps réel. Les données de vol peuvent avoir un délai de 5 min.</p>
      </div>
    </div>
  );
}
