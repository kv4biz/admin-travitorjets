// src/lib/validations/account.schema.ts
import { z } from "zod";

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "currentRequired"),
    new: z.string().min(6, "newMinLength"),
    confirm: z.string().min(1, "confirmRequired"),
  })
  .superRefine(({ new: newPassword, confirm }, ctx) => {
    if (newPassword !== confirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm"],
        message: "passwordMismatch",
      });
    }
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
