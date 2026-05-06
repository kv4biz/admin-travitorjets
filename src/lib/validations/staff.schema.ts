//src/lib/validations/staff.schema.ts
import { z } from "zod";

export const updateStaffRoleSchema = z.object({
  role: z.enum(["staff", "manager"]),
});

export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;

export const inviteStaffSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["staff", "manager"]).default("staff"),
});

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>;
