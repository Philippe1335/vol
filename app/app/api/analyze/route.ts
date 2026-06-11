import { NextRequest, NextResponse } from "next/server";

const AVIATION_STACK_KEY = process.env.AVIATION_STACK_KEY ?? "";
const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY ?? "";

// ─── Airport data ─────────────────────────────────────────────────────────────

type AirportInfo = {
  lat: number;
  lon: number;
  name: string;
  country: "CA" | "US" | "EU" | "OTHER";
};

const AIRPORTS: Record<string, AirportInfo> = {
  // Canada
  YUL: { lat: 45.4706, lon: -73.7408, name: "Montréal-Trudeau",    country: "CA" },
  YYZ: { lat: 43.6777, lon: -79.6248, name: "Toronto Pearson",      country: "CA" },
  YVR: { lat: 49.1967, lon: -123.1815,name: "Vancouver",            country: "CA" },
  YOW: { lat: 45.3225, lon: -75.6692, name: "Ottawa",               country: "CA" },
  YEG: { lat: 53.3097, lon: -113.5827,name: "Edmonton",             country: "CA" },
  YYC: { lat: 51.1139, lon: -114.0203,name: "Calgary",              country: "CA" },
  YHZ: { lat: 44.8808, lon: -63.5086, name: "Halifax",              country: "CA" },
  YWG: { lat: 49.9100, lon: -97.2399, name: "Winnipeg",             country: "CA" },
  YQB: { lat: 46.7911, lon: -71.3933, name: "Québec City",          country: "CA" },
  YXE: { lat: 52.1708, lon: -106.6997,name: "Saskatoon",            country: "CA" },
  // USA
  JFK: { lat: 40.6413, lon: -73.7781, name: "New York JFK",         country: "US" },
  LAX: { lat: 33.9425, lon: -118.408, name: "Los Angeles",          country: "US" },
  ORD: { lat: 41.9742, lon: -87.9073, name: "Chicago O'Hare",       country: "US" },
  ATL: { lat: 33.6407, lon: -84.4277, name: "Atlanta",              country: "US" },
  DFW: { lat: 32.8998, lon: -97.0403, name: "Dallas Fort Worth",    country: "US" },
  MIA: { lat: 25.7959, lon: -80.287,  name: "Miami",                country: "US" },
  BOS: { lat: 42.3656, lon: -71.0096, name: "Boston",               country: "US" },
  SEA: { lat: 47.4502, lon: -122.3088,name: "Seattle",              country: "US" },
  SFO: { lat: 37.6213, lon: -122.379, name: "San Francisco",        country: "US" },
  DEN: { lat: 39.8561, lon: -104.6737,name: "Denver",               country: "US" },
  LAS: { lat: 36.084,  lon: -115.1537,name: "Las Vegas",            country: "US" },
  MCO: { lat: 28.4312, lon: -81.3081, name: "Orlando",              country: "US" },
  EWR: { lat: 40.6895, lon: -74.1745, name: "Newark",               country: "US" },
  MSP: { lat: 44.8848, lon: -93.2223, name: "Minneapolis",          country: "US" },
  DTW: { lat: 42.2162, lon: -83.3554, name: "Detroit",              country: "US" },
  PHX: { lat: 33.4373, lon: -112.0078,name: "Phoenix",              country: "US" },
  CLT: { lat: 35.214,  lon: -80.9431, name: "Charlotte",            country: "US" },
  IAH: { lat: 29.9902, lon: -95.3368, name: "Houston Bush",         country: "US" },
  SLC: { lat: 40.7884, lon: -111.9778,name: "Salt Lake City",       country: "US" },
  MDW: { lat: 41.786,  lon: -87.7524, name: "Chicago Midway",       country: "US" },
  IAD: { lat: 38.9531, lon: -77.4565, name: "Washington Dulles",    country: "US" },
  DCA: { lat: 38.8512, lon: -77.0402, name: "Washington Reagan",    country: "US" },
  // Europe
  LHR: { lat: 51.477,  lon: -0.4613,  name: "London Heathrow",      country: "EU" },
  LGW: { lat: 51.1537, lon: -0.1821,  name: "London Gatwick",       country: "EU" },
  CDG: { lat: 49.0097, lon: 2.5479,   name: "Paris CDG",            country: "EU" },
  ORY: { lat: 48.7233, lon: 2.3794,   name: "Paris Orly",           country: "EU" },
  AMS: { lat: 52.3105, lon: 4.7683,   name: "Amsterdam Schiphol",   country: "EU" },
  FRA: { lat: 50.0379, lon: 8.5622,   name: "Frankfurt",            country: "EU" },
  MUC: { lat: 48.3538, lon: 11.7861,  name: "Munich",               country: "EU" },
  MAD: { lat: 40.4983, lon: -3.5676,  name: "Madrid Barajas",       country: "EU" },
  BCN: { lat: 41.2974, lon: 2.0833,   name: "Barcelona El Prat",    country: "EU" },
  FCO: { lat: 41.7999, lon: 12.2462,  name: "Rome Fiumicino",       country: "EU" },
  MXP: { lat: 45.6306, lon: 8.7281,   name: "Milan Malpensa",       country: "EU" },
  ZRH: { lat: 47.4647, lon: 8.5492,   name: "Zurich",               country: "EU" },
  VIE: { lat: 48.1103, lon: 16.5697,  name: "Vienna",               country: "EU" },
  BRU: { lat: 50.9014, lon: 4.4844,   name: "Brussels",             country: "EU" },
  CPH: { lat: 55.6180, lon: 12.6560,  name: "Copenhagen",           country: "EU" },
  ARN: { lat: 59.6519, lon: 17.9186,  name: "Stockholm Arlanda",    country: "EU" },
  OSL: { lat: 60.1939, lon: 11.1004,  name: "Oslo Gardermoen",      country: "EU" },
  HEL: { lat: 60.3172, lon: 24.9633,  name: "Helsinki",             country: "EU" },
  DUB: { lat: 53.4213, lon: -6.2701,  name: "Dublin",               country: "EU" },
  LIS: { lat: 38.7742, lon: -9.1342,  name: "Lisbon",               country: "EU" },
  ATH: { lat: 37.9364, lon: 23.9445,  name: "Athens",               country: "EU" },
  WAW: { lat: 52.1657, lon: 20.9671,  name: "Warsaw",               country: "EU" },
  PRG: { lat: 50.1008, lon: 14.26,    name: "Prague",               country: "EU" },
  BUD: { lat: 47.4369, lon: 19.2556,  name: "Budapest",             country: "EU" },
};

// Large Canadian carriers under APPR (>1M pax/year)
const LARGE_CANADIAN_CARRIERS = [
  "air canada", "westjet", "air transat", "porter", "sunwing", "flair",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type WeatherData = {
  description: string;
  wind_speed: number;
  visibility: number;
  temp: number;
  condition_id: number;
};

type FlightData = {
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

type CompensationTier = {
  amount: number;
  currency: string;
  condition: string;
};

export type CompensationResult = {
  regulation: "APPR" | "EU261" | "DOT" | "NONE";
  regulation_name: string;
  regulation_url: string;
  eligible: boolean;
  ineligible_reason: string | null;
  tiers: CompensationTier[];
  recommended_tier: CompensationTier | null;
  distance_km: number | null;
  carrier_size: "large" | "small" | null;
  next_steps: string[];
  claim_deadline: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isLargeCanadianCarrier(airline: string): boolean {
  return LARGE_CANADIAN_CARRIERS.some((c) => airline.toLowerCase().includes(c));
}

// Weather/safety/extraordinary circumstances = NOT in airline control
function isOutsideControl(claimedReason: CancellationCode | null): boolean {
  return claimedReason === "weather" || claimedReason === "security";
}

// ─── Compensation calculators ─────────────────────────────────────────────────

function calcAPPR(
  flight: FlightData,
  delayMinutes: number,
  outsideControl: boolean
): CompensationResult {
  const large = isLargeCanadianCarrier(flight.airline);
  const carrierSize: "large" | "small" = large ? "large" : "small";

  const base: Omit<CompensationResult, "tiers" | "recommended_tier"> = {
    regulation: "APPR",
    regulation_name: "Règlement sur la protection des passagers aériens (APPR) — Canada",
    regulation_url: "https://otc-cta.gc.ca/fra/protection-des-passagers-aeriens",
    eligible: false,
    ineligible_reason: null,
    distance_km: null,
    carrier_size: carrierSize,
    next_steps: [],
    claim_deadline: "1 an après le vol",
  };

  if (outsideControl) {
    return {
      ...base,
      eligible: false,
      ineligible_reason:
        "La perturbation est hors du contrôle de la compagnie (météo, sécurité). " +
        "Vous avez droit au réacheminement et aux soins (repas, hôtel), mais pas à l'indemnité monétaire.",
      tiers: [],
      recommended_tier: null,
      next_steps: [
        "Exiger un réacheminement sans frais (prochain vol dispo ou remboursement intégral).",
        "Conserver vos reçus repas / hôtel — la compagnie doit rembourser les frais raisonnables.",
        "Demander un bon de repas si l'attente dépasse 2 h.",
      ],
    };
  }

  if (delayMinutes < 180) {
    return {
      ...base,
      eligible: false,
      ineligible_reason: `Retard de ${delayMinutes} min. Le seuil APPR est 3 h (180 min) pour un grand transporteur.`,
      tiers: [],
      recommended_tier: null,
      next_steps: ["Si le retard final à destination dépasse 3 h, vous pouvez réclamer."],
    };
  }

  const tiers: CompensationTier[] = large
    ? [
        { amount: 400,  currency: "CAD", condition: "Retard 3–6 h à destination" },
        { amount: 700,  currency: "CAD", condition: "Retard 6–9 h à destination" },
        { amount: 1000, currency: "CAD", condition: "Retard 9 h+ à destination" },
      ]
    : [
        { amount: 125, currency: "CAD", condition: "Retard 3–6 h à destination" },
        { amount: 250, currency: "CAD", condition: "Retard 6–9 h à destination" },
        { amount: 500, currency: "CAD", condition: "Retard 9 h+ à destination" },
      ];

  let recommended: CompensationTier;
  if (delayMinutes >= 540)      recommended = tiers[2];
  else if (delayMinutes >= 360) recommended = tiers[1];
  else                          recommended = tiers[0];

  return {
    ...base,
    eligible: true,
    tiers,
    recommended_tier: recommended,
    next_steps: [
      `Soumettre une plainte directement à ${flight.airline} (obligatoire en premier).`,
      "Si refus ou absence de réponse sous 30 jours, déposer plainte à l'OTC (otc-cta.gc.ca).",
      "Conserver : carte d'embarquement, confirmation de réservation, reçus de dépenses.",
      "Délai de réclamation : 1 an après le vol.",
    ],
  };
}

function calcEU261(
  flight: FlightData,
  depInfo: AirportInfo,
  arrInfo: AirportInfo,
  delayMinutes: number,
  outsideControl: boolean
): CompensationResult {
  const distKm = Math.round(haversineKm(depInfo.lat, depInfo.lon, arrInfo.lat, arrInfo.lon));

  const base: Omit<CompensationResult, "tiers" | "recommended_tier"> = {
    regulation: "EU261",
    regulation_name: "Règlement (CE) n° 261/2004 — Union européenne",
    regulation_url: "https://europa.eu/youreurope/citizens/travel/passenger-rights/air/index_fr.htm",
    eligible: false,
    ineligible_reason: null,
    distance_km: distKm,
    carrier_size: null,
    next_steps: [],
    claim_deadline: "2 ans (variable selon le pays — jusqu'à 6 ans au Royaume-Uni)",
  };

  if (outsideControl) {
    return {
      ...base,
      eligible: false,
      ineligible_reason:
        "Circonstances extraordinaires (météo, grève externe, sécurité) : aucune indemnité financière. " +
        "Droit au réacheminement et aux soins (repas, hôtel) maintenus.",
      tiers: [],
      recommended_tier: null,
      next_steps: [
        "Exiger un réacheminement ou remboursement intégral.",
        "Si attente > 2 h: bons repas + 2 appels téléphoniques.",
        "Si vol reporté au lendemain: hôtel + transfert à la charge de la compagnie.",
      ],
    };
  }

  if (delayMinutes < 180) {
    return {
      ...base,
      eligible: false,
      ineligible_reason: `Retard de ${delayMinutes} min. Le seuil EU 261 est 3 h.`,
      tiers: [],
      recommended_tier: null,
      next_steps: [],
    };
  }

  let amount: number;
  let condition: string;
  if (distKm <= 1500) {
    amount = 250; condition = "Vol ≤ 1 500 km";
  } else if (distKm <= 3500) {
    amount = 400; condition = "Vol 1 500–3 500 km";
  } else {
    amount = 600; condition = "Vol > 3 500 km";
  }

  // 50% reduction if rerouted within time limits
  const halfAmount = amount / 2;
  const tiers: CompensationTier[] = [
    { amount, currency: "EUR", condition },
    {
      amount: halfAmount,
      currency: "EUR",
      condition: `${condition} — réduit 50% si réacheminement avec retard limité`,
    },
  ];

  return {
    ...base,
    eligible: true,
    tiers,
    recommended_tier: tiers[0],
    next_steps: [
      "Réclamation écrite directement à la compagnie aérienne.",
      "En cas de refus, contacter l'autorité nationale compétente (ex: DGAC en France, CAA au Royaume-Uni).",
      "Alternative: plateformes AirHelp, ClaimCompass, etc. (frais de commission ~25%).",
      `Délai: varie par pays (min. 2 ans, jusqu'à 6 ans au R.-U.).`,
    ],
  };
}

function calcDOT(
  flight: FlightData,
  delayMinutes: number
): CompensationResult {
  const base: Omit<CompensationResult, "tiers" | "recommended_tier"> = {
    regulation: "DOT",
    regulation_name: "DOT (Department of Transportation) — États-Unis",
    regulation_url: "https://www.transportation.gov/airconsumer/fly-rights",
    eligible: false,
    ineligible_reason: null,
    distance_km: null,
    carrier_size: null,
    next_steps: [],
    claim_deadline: "Pas de délai légal fédéral, mais recommandé < 1 an",
  };

  // US DOT only mandates cash for involuntary denied boarding; delays/cancellations = no set amount
  return {
    ...base,
    eligible: false,
    ineligible_reason:
      "La loi américaine n'impose pas d'indemnité fixe pour retards ou annulations (contrairement à l'UE ou au Canada). " +
      "Seul le refus d'embarquement involontaire (overbooking) ouvre droit à une indemnité.",
    tiers: [
      { amount: 775,  currency: "USD", condition: "Refus embarquement: retard arrivée 1–4 h (200% du billet, max $775)" },
      { amount: 1550, currency: "USD", condition: "Refus embarquement: retard arrivée > 4 h (400% du billet, max $1 550)" },
    ],
    recommended_tier: null,
    next_steps: [
      "Pour annulation: exiger le remboursement intégral si vous refusez l'alternative proposée.",
      "Vérifier les conditions tarifaires — certains tarifs incluent une assurance annulation.",
      "Déposer une plainte au DOT sur aviation.dot.gov si la compagnie ne rembourse pas.",
      "Contacter votre compagnie de carte de crédit (protection voyage intégrée fréquente).",
    ],
  };
}

// ─── Main compensation dispatcher ────────────────────────────────────────────

function calculateCompensation(
  flight: FlightData,
  claimedReason: CancellationCode | null
): CompensationResult {
  const dep = AIRPORTS[flight.departure_airport];
  const arr = AIRPORTS[flight.arrival_airport];
  const outside = isOutsideControl(claimedReason);

  // Effective delay: use departure_delay or assume 24h for full cancellation
  const delayMin =
    flight.status === "cancelled"
      ? 24 * 60
      : (flight.departure_delay ?? 0);

  // Regulation priority: APPR if departs from Canada
  if (dep?.country === "CA") {
    return calcAPPR(flight, delayMin, outside);
  }

  // EU261 if departs from EU, OR arrives in EU on an EU carrier
  if (dep?.country === "EU") {
    return calcEU261(flight, dep, arr ?? dep, delayMin, outside);
  }

  if (arr?.country === "EU") {
    // Only applies if operated by an EU carrier (heuristic: check airline name)
    const euCarrierHints = [
      "air france", "lufthansa", "klm", "british airways", "iberia", "ryanair",
      "easyjet", "vueling", "tap", "alitalia", "ita", "finnair", "sas",
      "austrian", "swiss", "brussels", "aegean",
    ];
    const isEuCarrier = euCarrierHints.some((c) =>
      flight.airline.toLowerCase().includes(c)
    );
    if (isEuCarrier && dep) {
      return calcEU261(flight, dep, arr, delayMin, outside);
    }
  }

  // US departure = DOT rules
  if (dep?.country === "US") {
    return calcDOT(flight, delayMin);
  }

  // Unknown jurisdiction
  return {
    regulation: "NONE",
    regulation_name: "Juridiction non déterminée",
    regulation_url: "",
    eligible: false,
    ineligible_reason:
      "L'aéroport de départ n'est pas dans notre base (Canada, UE, USA). " +
      "Des droits peuvent tout de même exister selon la législation locale.",
    tiers: [],
    recommended_tier: null,
    distance_km: dep && arr ? Math.round(haversineKm(dep.lat, dep.lon, arr.lat, arr.lon)) : null,
    carrier_size: null,
    next_steps: ["Consulter l'autorité de l'aviation civile du pays de départ."],
    claim_deadline: "Variable",
  };
}

// ─── Weather / ATC fetchers ───────────────────────────────────────────────────

async function fetchFlightData(flightNumber: string): Promise<FlightData | null> {
  if (!AVIATION_STACK_KEY) return null;

  const url = `http://api.aviationstack.com/v1/flights?access_key=${AVIATION_STACK_KEY}&flight_iata=${flightNumber}&limit=1`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;

  const json = await res.json();
  const flight = json?.data?.[0];
  if (!flight) return null;

  return {
    flight_number: flight.flight?.iata ?? flightNumber,
    airline: flight.airline?.name ?? "Unknown",
    status: flight.flight_status ?? "unknown",
    departure_airport: flight.departure?.iata ?? "",
    arrival_airport: flight.arrival?.iata ?? "",
    scheduled_departure: flight.departure?.scheduled ?? "",
    actual_departure: flight.departure?.actual ?? null,
    departure_delay: flight.departure?.delay ?? null,
    cancellation_reason: flight.flight?.codeshared?.airline_name ?? null,
    aircraft_type: flight.aircraft?.iata ?? null,
  };
}

async function fetchWeather(iata: string): Promise<WeatherData | null> {
  const airport = AIRPORTS[iata.toUpperCase()];
  if (!airport || !OPENWEATHER_KEY) return null;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${airport.lat}&lon=${airport.lon}&appid=${OPENWEATHER_KEY}&units=metric`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) return null;

  const json = await res.json();
  return {
    description: json.weather?.[0]?.description ?? "unknown",
    wind_speed: json.wind?.speed ?? 0,
    visibility: json.visibility ?? 10000,
    temp: json.main?.temp ?? 0,
    condition_id: json.weather?.[0]?.id ?? 800,
  };
}

async function fetchFAAStatus(iata: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nasstatus.faa.gov/api/airport-status-information`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const delays = json?.AIRPORT_STATUS_INFORMATION?.Delay_type ?? [];
    for (const delay of delays) {
      const list = Array.isArray(delay.Airport) ? delay.Airport : [delay.Airport];
      for (const ap of list) {
        if (ap?.["@attributes"]?.["IATACode"] === iata) {
          return `${delay["@attributes"]?.Type ?? "Delay"}: ${delay.Reason ?? ""}`;
        }
      }
    }
  } catch {
    // FAA API may be unavailable
  }
  return null;
}

// ─── Verdict logic ────────────────────────────────────────────────────────────

function isWeatherSevere(weather: WeatherData): { severe: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (weather.condition_id < 700) reasons.push(`Précipitations: ${weather.description}`);
  if (weather.condition_id >= 700 && weather.condition_id < 800)
    reasons.push(`Visibilité réduite: ${weather.description}`);
  if (weather.wind_speed > 15) reasons.push(`Vents forts: ${weather.wind_speed} m/s`);
  if (weather.visibility < 3000) reasons.push(`Faible visibilité: ${(weather.visibility / 1000).toFixed(1)} km`);
  if (weather.temp < -25) reasons.push(`Froid extrême: ${weather.temp}°C`);
  return { severe: reasons.length > 0, reasons };
}

type CancellationCode = "weather" | "technical" | "crew" | "traffic" | "security" | "other";

const REASON_KEYWORDS: Record<CancellationCode, string[]> = {
  weather:   ["weather", "météo", "storm", "tempête", "snow", "neige", "ice", "glace", "wind", "vent", "fog", "brouillard", "rain", "pluie"],
  technical: ["technical", "technique", "maintenance", "mechanical", "mécanique", "aircraft", "avion", "equipment"],
  crew:      ["crew", "équipage", "pilot", "pilote", "staff", "personnel"],
  traffic:   ["traffic", "trafic", "atc", "congestion", "slot", "air traffic"],
  security:  ["security", "sécurité", "customs", "douane"],
  other:     [],
};

function detectClaimedReason(text: string): CancellationCode {
  const lower = text.toLowerCase();
  for (const [code, keywords] of Object.entries(REASON_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return code as CancellationCode;
  }
  return "other";
}

type Verdict = "plausible" | "doubtful" | "suspicious" | "insufficient_data";

function buildVerdict(
  flight: FlightData | null,
  depWeather: WeatherData | null,
  arrWeather: WeatherData | null,
  faaStatus: string | null,
  claimedReason: CancellationCode | null
): { verdict: Verdict; confidence: number; explanation: string[] } {
  const explanation: string[] = [];

  if (!flight) {
    return { verdict: "insufficient_data", confidence: 0,
      explanation: ["Impossible de récupérer les données du vol. Vérifiez le numéro de vol."] };
  }

  if (!claimedReason) {
    return { verdict: "insufficient_data", confidence: 30,
      explanation: ["La compagnie n'a pas fourni de raison officielle."] };
  }

  const depSevere = depWeather ? isWeatherSevere(depWeather) : null;
  const arrSevere = arrWeather ? isWeatherSevere(arrWeather) : null;

  if (claimedReason === "weather") {
    if (depSevere?.severe || arrSevere?.severe) {
      explanation.push("✓ La météo confirme des conditions difficiles.");
      if (depSevere?.severe) explanation.push(...depSevere.reasons.map((r) => `  Départ: ${r}`));
      if (arrSevere?.severe) explanation.push(...arrSevere.reasons.map((r) => `  Arrivée: ${r}`));
      return { verdict: "plausible", confidence: 85, explanation };
    }
    if (depWeather && arrWeather) {
      explanation.push("⚠ La météo aux deux aéroports semble normale.");
      explanation.push(`  Départ: ${depWeather.description}, vents ${depWeather.wind_speed} m/s`);
      explanation.push(`  Arrivée: ${arrWeather.description}, vents ${arrWeather.wind_speed} m/s`);
      return { verdict: "suspicious", confidence: 75, explanation };
    }
    explanation.push("Données météo partielles — impossible de confirmer ou infirmer.");
    return { verdict: "doubtful", confidence: 40, explanation };
  }

  if (claimedReason === "traffic") {
    if (faaStatus) {
      explanation.push(`✓ Restrictions ATC confirmées: ${faaStatus}`);
      return { verdict: "plausible", confidence: 80, explanation };
    }
    explanation.push("Aucune restriction ATC trouvée dans les données FAA publiques.");
    return { verdict: "doubtful", confidence: 50, explanation };
  }

  if (claimedReason === "technical" || claimedReason === "crew") {
    explanation.push(`Raison "${claimedReason}" difficile à vérifier avec des données publiques.`);
    if (flight.departure_delay && flight.departure_delay > 180) {
      explanation.push(`Retard de ${flight.departure_delay} min — cohérent avec une panne technique.`);
      return { verdict: "plausible", confidence: 60, explanation };
    }
    explanation.push("Aucune donnée externe ne permet de confirmer cette raison.");
    return { verdict: "insufficient_data", confidence: 40, explanation };
  }

  explanation.push("Analyse croisée non concluante avec les données disponibles.");
  return { verdict: "insufficient_data", confidence: 40, explanation };
}

// ─── Demo data ────────────────────────────────────────────────────────────────

function getDemoFlight(flightNumber: string): FlightData {
  return {
    flight_number: flightNumber,
    airline: "Air Canada (démonstration)",
    status: "cancelled",
    departure_airport: "YUL",
    arrival_airport: "YYZ",
    scheduled_departure: new Date().toISOString(),
    actual_departure: null,
    departure_delay: null,
    cancellation_reason: "weather",
    aircraft_type: "B738",
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const flightNumber = searchParams.get("flight")?.toUpperCase().replace(/\s/g, "");

  if (!flightNumber) {
    return NextResponse.json({ error: "Paramètre 'flight' requis" }, { status: 400 });
  }

  const demoMode = !AVIATION_STACK_KEY;
  const flight = demoMode ? getDemoFlight(flightNumber) : await fetchFlightData(flightNumber);

  const depIATA = flight?.departure_airport ?? "";
  const arrIATA = flight?.arrival_airport ?? "";

  const [depWeather, arrWeather, faaStatus] = await Promise.all([
    depIATA ? fetchWeather(depIATA) : Promise.resolve(null),
    arrIATA ? fetchWeather(arrIATA) : Promise.resolve(null),
    depIATA ? fetchFAAStatus(depIATA) : Promise.resolve(null),
  ]);

  const claimedReason = flight?.cancellation_reason
    ? detectClaimedReason(flight.cancellation_reason)
    : null;

  const { verdict, confidence, explanation } = buildVerdict(
    flight, depWeather, arrWeather, faaStatus, claimedReason
  );

  const compensation = flight
    ? calculateCompensation(flight, claimedReason)
    : null;

  return NextResponse.json({
    flight,
    departure_weather: depWeather,
    arrival_weather: arrWeather,
    faa_status: faaStatus,
    claimed_reason: claimedReason,
    verdict,
    confidence,
    explanation,
    departure_airport_name: AIRPORTS[depIATA]?.name ?? depIATA,
    arrival_airport_name: AIRPORTS[arrIATA]?.name ?? arrIATA,
    compensation,
    demo_mode: demoMode,
  });
}
