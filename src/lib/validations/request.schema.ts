//src/lib/validations/request.schema.ts
import { z } from "zod";

export const updateRequestSchema = z.object({
  status: z.enum(["open", "assigned", "confirmed", "closed"]).optional(),
  price_agreed: z.number().positive().optional(),
  assigned_staff_id: z.string().uuid().nullable().optional(),
});

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
