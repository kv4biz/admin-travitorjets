/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/requests/[id]/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (_, supabase) => {
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    console.log("Fetching request ID:", id);

    // Main request with user
    const { data: req, error } = await serviceClient
      .from("requests")
      .select(
        `
        id,
        type,
        status,
        created_at,
        assigned_staff_id,
        details,
        user:user_id(
          id,
          full_name,
          username
        )
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase error:", error);
      return apiError(error.message, 500);
    }

    if (!req) {
      console.log("❌ No request found for id:", id);
      return apiError("Request not found", 404);
    }

    // Single invoice for this request
    const { data: invoice, error: invoiceError } = await serviceClient.from("invoices").select("*").eq("request_id", id).maybeSingle();

    if (invoiceError) {
      console.error("⚠️ Invoice fetch error:", invoiceError);
    }

    // Return request + invoice (no documents)
    return apiSuccess({
      ...req,
      invoice: invoice ?? null,
    });
  });
}
