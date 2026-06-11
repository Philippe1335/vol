"use client";

import type { CompensationResult } from "@/app/page";

type Props = { compensation: CompensationResult };

const REGULATION_FLAG: Record<string, string> = {
  APPR:  "🍁",
  EU261: "🇪🇺",
  DOT:   "🇺🇸",
  NONE:  "🌐",
};

function fmt(amount: number, currency: string): string {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default function CompensationCard({ compensation: c }: Props) {
  const flag = REGULATION_FLAG[c.regulation] ?? "🌐";

  return (
    <div className={`border rounded-2xl overflow-hidden ${
      c.eligible
        ? "bg-emerald-900/20 border-emerald-500/40"
        : "bg-slate-800/40 border-slate-600/40"
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 flex items-center gap-3 ${
        c.eligible ? "bg-emerald-900/30" : "bg-slate-800/60"
      }`}>
        <span className="text-3xl">{flag}</span>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">Règlement applicable</p>
          <p className="font-semibold text-sm leading-snug">{c.regulation_name}</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Montant recommandé */}
        {c.eligible && c.recommended_tier ? (
          <div className="text-center py-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Indemnité estimée</p>
            <p className="text-5xl font-bold text-emerald-400">
              {fmt(c.recommended_tier.amount, c.recommended_tier.currency)}
            </p>
            <p className="text-slate-300 text-sm mt-2">{c.recommended_tier.condition}</p>
            {c.carrier_size && (
              <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${
                c.carrier_size === "large"
                  ? "bg-blue-900/40 text-blue-300"
                  : "bg-slate-700 text-slate-300"
              }`}>
                {c.carrier_size === "large" ? "Grand transporteur" : "Petit transporteur"}
              </span>
            )}
            {c.distance_km && (
              <p className="text-slate-400 text-xs mt-1">Distance: {c.distance_km.toLocaleString("fr-CA")} km</p>
            )}
          </div>
        ) : (
          <div className="py-3">
            <p className="text-slate-300 text-sm leading-relaxed">{c.ineligible_reason}</p>
          </div>
        )}

        {/* Tous les paliers */}
        {c.tiers.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Tous les paliers</p>
            <div className="space-y-2">
              {c.tiers.map((tier, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    c.recommended_tier?.amount === tier.amount && c.recommended_tier?.condition === tier.condition
                      ? "bg-emerald-800/40 border border-emerald-500/40"
                      : "bg-white/5"
                  }`}
                >
                  <span className="text-slate-300">{tier.condition}</span>
                  <span className="font-mono font-bold ml-3 whitespace-nowrap">
                    {fmt(tier.amount, tier.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Démarches */}
        {c.next_steps.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Comment réclamer</p>
            <ol className="space-y-2">
              {c.next_steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Délai + lien */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-slate-400">
          <span>Délai de réclamation: {c.claim_deadline}</span>
          {c.regulation_url && (
            <a
              href={c.regulation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition"
            >
              Texte officiel →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
