//src/lib/validations/staff.schema.ts
import { z } from "zod";

export const updateStaffRoleSchema = z.object({
  role: z.enum(["staff", "manager"]),
});

export type UpdateStaffRoleInput = z.infer<typeof updateStaffRoleSchema>;
