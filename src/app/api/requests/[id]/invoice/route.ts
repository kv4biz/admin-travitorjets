/* eslint-disable @typescript-eslint/no-unused-vars */
//src/app/api/requests/[id]/invoice/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ---------- Validation schemas ----------
const uploadInvoiceSchema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required"),
  invoice_url: z.string().url("Invalid invoice file URL"),
});

const updateInvoiceSchema = z.object({
  payment_receipt_url: z.string().url().optional(),
  payment_reference: z.string().optional(),
  confirmation_document_url: z.string().url().optional(),
  status: z.enum(["paid", "confirmed"]).optional(),
});

// ---------- GET – fetch the invoice for a request (max 1) ----------
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (_, supabase) => {
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const { data, error } = await serviceClient.from("invoices").select("*").eq("request_id", id).maybeSingle();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data); // null if no invoice yet
  });
}

// ---------- POST – upload a new invoice (one per request) ----------
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (user, supabase) => {
    // 1. Check no existing invoice
    const { data: existing } = await supabase.from("invoices").select("id").eq("request_id", id).maybeSingle();

    if (existing) return apiError("An invoice already exists for this request", 409);

    // 2. Parse body
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = uploadInvoiceSchema.safeParse(body);
    if (!validation.success) return apiError(validation.error.issues[0].message, 400);

    // 3. Insert using service client
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const { data: invoiceData, error: insertError } = await serviceClient
      .from("invoices")
      .insert({
        request_id: id,
        invoice_number: validation.data.invoice_number,
        invoice_url: validation.data.invoice_url,
        status: "sent",
        created_by: user.id,
        recipient_id: undefined, // will be set in frontend with request.user_id
      })
      .select()
      .single();

    if (insertError) return apiError(insertError.message, 500);

    return apiSuccess(invoiceData);
  });
}
// ---------- PATCH – update the invoice (receipt, confirmation, status) ----------
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (user, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = updateInvoiceSchema.safeParse(body);
    if (!validation.success) return apiError(validation.error.issues[0].message, 400);

    // ✅ Use service‑role client (same as POST / GET)
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    // Fetch the existing invoice
    const { data: invoice, error: fetchError } = await serviceClient.from("invoices").select("*").eq("request_id", id).single();

    if (fetchError || !invoice) return apiError("No invoice found for this request. Please upload an invoice first.", 404);

    const updateData: Record<string, unknown> = {};

    if (validation.data.payment_receipt_url !== undefined) updateData.payment_receipt_url = validation.data.payment_receipt_url;
    if (validation.data.payment_reference !== undefined) updateData.payment_reference = validation.data.payment_reference;
    if (validation.data.confirmation_document_url !== undefined) {
      updateData.confirmation_document_url = validation.data.confirmation_document_url;
      // ✅ Always set status to "confirmed" when confirmation is uploaded
      updateData.status = "confirmed";
    } else if (validation.data.status === "paid" && invoice.status === "sent") {
      updateData.status = "paid";
      updateData.paid_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length === 0) return apiError("No valid fields to update", 400);

    const { data: updated, error: updateError } = await serviceClient.from("invoices").update(updateData).eq("id", invoice.id).select().single();

    if (updateError) return apiError(updateError.message, 500);

    return apiSuccess(updated);
  });
}
