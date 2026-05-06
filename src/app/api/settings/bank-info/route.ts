/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/settings/bank-info/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const bankInfoSchema = z.object({
  bank_name: z.string().min(1, "Bank name is required"),
  account_number: z.string().min(1, "Account number is required"),
  account_holder: z.string().min(1, "Account holder is required"),
  iban: z.string().optional(),
  swift: z.string().optional(),
});

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    // Service‑role client to bypass RLS
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const { data, error } = await serviceClient
      .from("company_bank_info")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data ?? null);
  });
}

export async function PUT(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = bankInfoSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    // Check if a row already exists
    const { data: existing } = await serviceClient.from("company_bank_info").select("id").limit(1).maybeSingle();

    let result;
    if (existing) {
      result = await serviceClient.from("company_bank_info").update(validation.data).eq("id", existing.id).select().single();
    } else {
      result = await serviceClient.from("company_bank_info").insert(validation.data).select().single();
    }

    const { data, error } = result;
    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
