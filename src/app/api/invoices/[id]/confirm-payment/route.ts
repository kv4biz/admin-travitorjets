//src/app/api/invoices/[id]/confirm-payment/route.ts
import { NextRequest } from "next/server";
import {
  withAdminAuth,
  apiSuccess,
  apiError,
  parseBody,
} from "@/lib/api-utils";
import { z } from "zod";

const confirmPaymentSchema = z.object({
  file_url: z.string().min(1),
  title: z.string().optional(),
});

type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAdminAuth(async (adminUser, supabase) => {
    const { data: body, error: parseError } =
      await parseBody<ConfirmPaymentInput>(request);
    if (parseError) return apiError(parseError, 400);

    const validation = confirmPaymentSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const invoiceId = params.id;

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, status, request_id")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return apiError(invoiceError?.message || "Invoice not found", 404);
    }

    if (invoice.status === "paid") {
      return apiError("Invoice already marked as paid", 400);
    }

    const { data: reqRow, error: reqError } = await supabase
      .from("requests")
      .select("id, user_id")
      .eq("id", invoice.request_id)
      .single();

    if (reqError || !reqRow) {
      return apiError(reqError?.message || "Request not found", 404);
    }

    const paidAt = new Date().toISOString();

    const { data: updatedInvoice, error: updateInvoiceError } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: paidAt })
      .eq("id", invoiceId)
      .select()
      .single();

    if (updateInvoiceError) {
      return apiError(updateInvoiceError.message, 500);
    }

    const { data: receiptDoc, error: docError } = await supabase
      .from("documents")
      .insert({
        invoice_id: invoiceId,
        request_id: invoice.request_id,
        user_id: reqRow.user_id,
        title: validation.data.title || "Payment receipt",
        file_url: validation.data.file_url,
        type: "payment_receipt",
      })
      .select()
      .single();

    if (docError) {
      return apiError(docError.message, 500);
    }

    await supabase.from("admin_activities").insert({
      staff_id: adminUser.id,
      action: "confirm_payment",
      request_id: invoice.request_id,
    });

    return apiSuccess({ invoice: updatedInvoice, receipt_document: receiptDoc });
  });
}
