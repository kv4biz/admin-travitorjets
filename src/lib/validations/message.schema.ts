//src/lib/validations/message.schema.ts
import { z } from "zod";

export const createMessageSchema = z.object({
  request_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  attachment_urls: z.array(z.string().url()).optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
