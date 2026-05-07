// src/app/api/empty-legs/clear/route.ts
import { NextRequest } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { apiSuccess, apiError } from "@/lib/api-utils";

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
    },
  });
}

/* ---------------- AUTH ---------------- */

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  /* ✅ External/manual */
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  /* ✅ Internal frontend */
  const origin = request.headers.get("origin");

  const host = request.headers.get("host");

  if (origin && host && origin.includes(host)) {
    return true;
  }

  return false;
}

/* ---------------- POST ---------------- */

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return apiError("Unauthorized", 401);
  }

  const supabase = getSupabaseAdmin();

  try {
    const { error } = await supabase.from("empty_legs").delete().eq("source", "pexjet");

    if (error) {
      return apiError(error.message, 500);
    }

    return apiSuccess({
      message: "All PexJet data cleared",
    });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
