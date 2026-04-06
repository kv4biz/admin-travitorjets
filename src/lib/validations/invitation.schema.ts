//src/lib/validations/invitation.schema.ts
import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.literal("staff"), // only staff can be invited
});

export const acceptInvitationSchema = z.object({
  password: z.string().min(6),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
