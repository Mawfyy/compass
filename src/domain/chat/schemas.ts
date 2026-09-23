import { z } from "zod";
import { guideSchema } from "../guide/schemas";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const chatRequestSchema = z.object({
  goal: z.string().trim().min(1).max(200),
  guide: guideSchema,
  messages: z.array(chatMessageSchema).min(1).max(20),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
