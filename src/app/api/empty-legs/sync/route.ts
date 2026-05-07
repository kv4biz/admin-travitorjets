// src/app/api/empty-legs/sync/route.ts
import { NextRequest } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { apiSuccess, apiError } from "@/lib/api-utils";

/* ---------------- CONFIG ---------------- */

const PEXJET_API_URL = "https://pexjet.com/api/external/empty-legs";
const PEXJET_TOKEN = process.env.PEXJET_API_TOKEN!;
const CRON_SECRET = process.env.CRON_SECRET!;

/* ---------------- TYPES ---------------- */

interface PexJetAirport {
  iataCode?: string;
  icaoCode?: string;
  name?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface PexJetAircraft {
  name?: string;
  category?: string;
  maxPax?: number;
  image?: string;
}

interface PexJetLeg {
  id: string;
  slug: string;
  departureAirport: PexJetAirport;
  arrivalAirport: PexJetAirport;
  aircraft?: PexJetAircraft;
  departureDate: string;
  availableSeats: number;
  totalSeats: number;
  priceUsd?: number | null;
  priceType?: "CONTACT" | "FIXED";
}

/* ---------------- HELPERS ---------------- */

function getSupabaseAdmin(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/* ---------------- AUTH ---------------- */

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  /* ✅ Postman/manual external */
  if (authHeader === `Bearer ${CRON_SECRET}`) {
    return true;
  }

  /* ✅ Vercel cron */
  const cronHeader = request.headers.get("x-vercel-cron");

  if (cronHeader === "1") {
    return true;
  }

  /* ✅ Internal frontend requests */
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (origin && host && origin.includes(host)) {
    return true;
  }

  return false;
}

/* ---------------- AIRPORT UPSERT ---------------- */

async function upsertAirport(supabase: SupabaseClient, airport: PexJetAirport) {
  if (!airport.icaoCode) return;

  await supabase.from("airports").upsert(
    {
      icao: airport.icaoCode,
      iata: airport.iataCode ?? null,
      name: airport.name ?? airport.icaoCode,
      city: airport.city ?? null,
      country: airport.country ?? null,
      latitude: airport.latitude ?? null,
      longitude: airport.longitude ?? null,
    },
    {
      onConflict: "icao",
    },
  );
}

/* ---------------- FIND AIRPORT ---------------- */

async function findAirportId(supabase: SupabaseClient, iata?: string, icao?: string): Promise<string | null> {
  if (icao) {
    const { data } = await supabase.from("airports").select("id").eq("icao", icao).maybeSingle();

    if (data?.id) {
      return data.id;
    }
  }

  if (iata) {
    const { data } = await supabase.from("airports").select("id").eq("iata", iata).maybeSingle();

    if (data?.id) {
      return data.id;
    }
  }

  return null;
}

/* ---------------- MAP ---------------- */

async function mapPexJetToDb(leg: PexJetLeg, supabase: SupabaseClient) {
  const depAirportId = await findAirportId(supabase, leg.departureAirport?.iataCode, leg.departureAirport?.icaoCode);

  const arrAirportId = await findAirportId(supabase, leg.arrivalAirport?.iataCode, leg.arrivalAirport?.icaoCode);

  return {
    external_id: leg.id,
    slug: leg.slug,
    dep_airport_id: depAirportId,
    arr_airport_id: arrAirportId,
    departure_time: leg.departureDate,

    aircraft_type_id: null,

    aircraft_name: leg.aircraft?.name ?? null,
    aircraft_category: leg.aircraft?.category ?? null,
    aircraft_max_pax: leg.aircraft?.maxPax ?? null,
    aircraft_image: leg.aircraft?.image ?? null,

    available_seats: leg.availableSeats,
    total_seats: leg.totalSeats,

    price: leg.priceUsd ?? null,

    currency_code: "USD",

    price_type: leg.priceType === "CONTACT" ? "contact" : "fixed",

    comment: null,
    destination_image_url: null,
    destination_description: null,
  };
}

/* ---------------- MAIN SYNC ---------------- */

async function runSync() {
  const supabase = getSupabaseAdmin();

  let page = 1;

  const limit = 100;

  let hasMore = true;

  let synced = 0;
  let skipped = 0;

  const failed: string[] = [];

  const allExternalIds = new Set<string>();

  while (hasMore) {
    const res = await fetch(`${PEXJET_API_URL}?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${PEXJET_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`PexJet API error: ${res.status}`);
    }

    const json = await res.json();

    const legs: PexJetLeg[] = json.data || [];

    const meta = json.meta;

    for (const leg of legs) {
      allExternalIds.add(leg.id);

      await upsertAirport(supabase, leg.departureAirport);

      await upsertAirport(supabase, leg.arrivalAirport);

      const mapped = await mapPexJetToDb(leg, supabase);

      if (!mapped.dep_airport_id || !mapped.arr_airport_id) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("empty_legs").upsert(
        {
          ...mapped,

          source: "pexjet",

          owner_type: "pexjet",

          is_public: false,

          external_updated_at: new Date().toISOString(),
        },
        {
          onConflict: "external_id",
        },
      );

      if (error) {
        failed.push(`${leg.id}: ${error.message}`);

        continue;
      }

      synced++;
    }

    if (!meta || page >= meta.totalPages) {
      hasMore = false;
    } else {
      page++;
    }
  }

  /* ---------------- DELETE OLD ---------------- */

  const { data: existing } = await supabase.from("empty_legs").select("id, external_id").eq("source", "pexjet");

  if (existing) {
    const toDelete = existing.filter((row) => !allExternalIds.has(row.external_id)).map((row) => row.id);

    if (toDelete.length > 0) {
      await supabase.from("empty_legs").delete().in("id", toDelete);
    }
  }

  return {
    synced,
    skipped,
    failedCount: failed.length,
    deletedOld: true,
    failed: failed.slice(0, 10),
  };
}

/* ---------------- GET ---------------- */

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return apiError("Unauthorized", 401);
  }

  try {
    const result = await runSync();

    return apiSuccess(result);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}

/* ---------------- POST ---------------- */

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return apiError("Unauthorized", 401);
  }

  try {
    const result = await runSync();

    return apiSuccess(result);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
