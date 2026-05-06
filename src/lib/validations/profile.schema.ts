//src/lib/validations/profile.schema.ts
import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100, "Full name is too long"),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores allowed"),

  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[0-9]{7,15}$/.test(val), {
      message: "Invalid phone number",
    }),
});

export type ProfileInput = z.infer<typeof profileSchema>;
