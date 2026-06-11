import { NextRequest, NextResponse } from "next/server";

const AVIATION_STACK_KEY = process.env.AVIATION_STACK_KEY ?? "";
const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY ?? "";

// IATA airport code -> lat/lon lookup for weather (common airports)
const AIRPORT_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  YUL: { lat: 45.4706, lon: -73.7408, name: "Montréal-Trudeau" },
  YYZ: { lat: 43.6777, lon: -79.6248, name: "Toronto Pearson" },
  YVR: { lat: 49.1967, lon: -123.1815, name: "Vancouver" },
  YOW: { lat: 45.3225, lon: -75.6692, name: "Ottawa" },
  YEG: { lat: 53.3097, lon: -113.5827, name: "Edmonton" },
  YYC: { lat: 51.1139, lon: -114.0203, name: "Calgary" },
  JFK: { lat: 40.6413, lon: -73.7781, name: "New York JFK" },
  LAX: { lat: 33.9425, lon: -118.408, name: "Los Angeles" },
  ORD: { lat: 41.9742, lon: -87.9073, name: "Chicago O'Hare" },
  ATL: { lat: 33.6407, lon: -84.4277, name: "Atlanta" },
  DFW: { lat: 32.8998, lon: -97.0403, name: "Dallas Fort Worth" },
  LHR: { lat: 51.477, lon: -0.4613, name: "London Heathrow" },
  CDG: { lat: 49.0097, lon: 2.5479, name: "Paris CDG" },
  AMS: { lat: 52.3105, lon: 4.7683, name: "Amsterdam Schiphol" },
  FRA: { lat: 50.0379, lon: 8.5622, name: "Frankfurt" },
  MIA: { lat: 25.7959, lon: -80.287, name: "Miami" },
  BOS: { lat: 42.3656, lon: -71.0096, name: "Boston" },
  SEA: { lat: 47.4502, lon: -122.3088, name: "Seattle" },
  SFO: { lat: 37.6213, lon: -122.379, name: "San Francisco" },
  DEN: { lat: 39.8561, lon: -104.6737, name: "Denver" },
  LAS: { lat: 36.084, lon: -115.1537, name: "Las Vegas" },
  MCO: { lat: 28.4312, lon: -81.3081, name: "Orlando" },
  EWR: { lat: 40.6895, lon: -74.1745, name: "Newark" },
  MSP: { lat: 44.8848, lon: -93.2223, name: "Minneapolis" },
  DTW: { lat: 42.2162, lon: -83.3554, name: "Detroit" },
  PHX: { lat: 33.4373, lon: -112.0078, name: "Phoenix" },
  CLT: { lat: 35.214, lon: -80.9431, name: "Charlotte" },
  IAH: { lat: 29.9902, lon: -95.3368, name: "Houston Bush" },
  SLC: { lat: 40.7884, lon: -111.9778, name: "Salt Lake City" },
  MDW: { lat: 41.786, lon: -87.7524, name: "Chicago Midway" },
};

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
  const coords = AIRPORT_COORDS[iata.toUpperCase()];
  if (!coords || !OPENWEATHER_KEY) return null;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${OPENWEATHER_KEY}&units=metric`;
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

// FAA NASSTATUS for US airport delays (no key needed)
async function fetchFAAStatus(iata: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nasstatus.faa.gov/api/airport-status-information`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const airports = json?.AIRPORT_STATUS_INFORMATION?.Delay_type ?? [];
    for (const delay of airports) {
      const list = Array.isArray(delay.Airport) ? delay.Airport : [delay.Airport];
      for (const ap of list) {
        if (ap?.["@attributes"]?.["ICAOCode"]?.endsWith(iata) ||
            ap?.["@attributes"]?.["IATACode"] === iata) {
          return `${delay["@attributes"]?.Type ?? "Delay"}: ${delay.Reason ?? ""}`;
        }
      }
    }
  } catch {
    // FAA API may be unavailable
  }
  return null;
}

function isWeatherSevere(weather: WeatherData): { severe: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Thunderstorm, drizzle, rain, snow, atmosphere (fog/mist), etc.
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
  weather: ["weather", "météo", "storm", "tempête", "snow", "neige", "ice", "glace", "wind", "vent", "fog", "brouillard", "rain", "pluie"],
  technical: ["technical", "technique", "maintenance", "mechanical", "mécanique", "aircraft", "avion", "equipment"],
  crew: ["crew", "équipage", "pilot", "pilote", "staff", "personnel"],
  traffic: ["traffic", "trafic", "atc", "congestion", "slot", "air traffic"],
  security: ["security", "sécurité", "customs", "douane"],
  other: [],
};

function detectClaimedReason(text: string): CancellationCode {
  const lower = text.toLowerCase();
  for (const [code, keywords] of Object.entries(REASON_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return code as CancellationCode;
  }
  return "other";
}

type Verdict = "plausible" | "doubtful" | "suspicious" | "insufficient_data";

type AnalysisResult = {
  flight: FlightData | null;
  departure_weather: WeatherData | null;
  arrival_weather: WeatherData | null;
  faa_status: string | null;
  claimed_reason: CancellationCode | null;
  verdict: Verdict;
  confidence: number; // 0-100
  explanation: string[];
  departure_airport_name: string;
  arrival_airport_name: string;
  demo_mode: boolean;
};

function buildVerdict(
  flight: FlightData | null,
  depWeather: WeatherData | null,
  arrWeather: WeatherData | null,
  faaStatus: string | null,
  claimedReason: CancellationCode | null
): { verdict: Verdict; confidence: number; explanation: string[] } {
  const explanation: string[] = [];
  let confidence = 50;

  if (!flight) {
    return {
      verdict: "insufficient_data",
      confidence: 0,
      explanation: ["Impossible de récupérer les données du vol. Vérifiez le numéro de vol."],
    };
  }

  const depSevere = depWeather ? isWeatherSevere(depWeather) : null;
  const arrSevere = arrWeather ? isWeatherSevere(arrWeather) : null;

  if (!claimedReason) {
    explanation.push("La compagnie n'a pas fourni de raison officielle.");
    confidence = 30;
    return { verdict: "insufficient_data", confidence, explanation };
  }

  if (claimedReason === "weather") {
    if (depSevere?.severe || arrSevere?.severe) {
      explanation.push("✓ La météo confirme des conditions difficiles.");
      if (depSevere?.severe) explanation.push(...depSevere.reasons.map((r) => `  Départ: ${r}`));
      if (arrSevere?.severe) explanation.push(...arrSevere.reasons.map((r) => `  Arrivée: ${r}`));
      confidence = 85;
      return { verdict: "plausible", confidence, explanation };
    } else {
      if (depWeather && arrWeather) {
        explanation.push("⚠ La météo aux deux aéroports semble normale.");
        explanation.push(`  Départ: ${depWeather.description}, vents ${depWeather.wind_speed} m/s`);
        explanation.push(`  Arrivée: ${arrWeather.description}, vents ${arrWeather.wind_speed} m/s`);
        confidence = 75;
        return { verdict: "suspicious", confidence, explanation };
      }
      explanation.push("Données météo partielles — impossible de confirmer ou infirmer.");
      confidence = 40;
      return { verdict: "doubtful", confidence, explanation };
    }
  }

  if (claimedReason === "traffic") {
    if (faaStatus) {
      explanation.push(`✓ Restrictions ATC confirmées: ${faaStatus}`);
      confidence = 80;
      return { verdict: "plausible", confidence, explanation };
    }
    explanation.push("Aucune restriction ATC trouvée dans les données FAA publiques.");
    confidence = 50;
    return { verdict: "doubtful", confidence, explanation };
  }

  if (claimedReason === "technical" || claimedReason === "crew") {
    explanation.push(
      `Raison "${claimedReason}" difficile à vérifier avec des données publiques.`
    );
    if (flight.departure_delay && flight.departure_delay > 180) {
      explanation.push(`Retard de ${flight.departure_delay} min — cohérent avec une panne technique.`);
      confidence = 60;
      return { verdict: "plausible", confidence, explanation };
    }
    explanation.push("Aucune donnée externe ne permet de confirmer cette raison.");
    confidence = 40;
    return { verdict: "insufficient_data", confidence, explanation };
  }

  explanation.push("Analyse croisée non concluante avec les données disponibles.");
  return { verdict: "insufficient_data", confidence: 40, explanation };
}

// Demo flight data when no API keys are configured
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
    flight,
    depWeather,
    arrWeather,
    faaStatus,
    claimedReason
  );

  const result: AnalysisResult = {
    flight,
    departure_weather: depWeather,
    arrival_weather: arrWeather,
    faa_status: faaStatus,
    claimed_reason: claimedReason,
    verdict,
    confidence,
    explanation,
    departure_airport_name: AIRPORT_COORDS[depIATA]?.name ?? depIATA,
    arrival_airport_name: AIRPORT_COORDS[arrIATA]?.name ?? arrIATA,
    demo_mode: demoMode,
  };

  return NextResponse.json(result);
}
