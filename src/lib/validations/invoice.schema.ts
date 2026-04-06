//src/lib/validations/invoice.schema.ts
import { z } from "zod";

export const createInvoiceSchema = z.object({
  request_id: z.string().uuid(),
  amount: z.number().positive(),
  currency_code: z.string().default("USD"),
  bank_details: z.record(z.any(), z.any()).optional(),
  reference_code: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(["sent", "paid", "cancelled"]).optional(),
  bank_details: z.record(z.any(), z.any()).optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
