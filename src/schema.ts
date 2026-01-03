import { z } from "zod";

// Payload from the app after 7 rounds
export const JudgePayloadSchema = z.object({
  promptIcon: z.string().min(1).max(8),
  chosenTags: z.array(z.string().min(1).max(32)).min(1).max(200),
  othersSummary: z.array(
    z.object({
      shownTags: z.array(z.string().min(1).max(32)).min(1).max(30),
      chosenIndex: z.number().int().min(0).max(2)
    })
  ).min(1).max(20),
  responseTimeMs: z.array(z.number().int().min(50).max(300000)).min(1).max(50)
});

export type JudgePayload = z.infer<typeof JudgePayloadSchema>;

// Strict output shape
export const JudgeResultSchema = z.object({
  label: z.string().min(2).max(40),
  roast: z.string().min(10).max(260),
  cta: z.string().min(2).max(40),
  safetyLevel: z.enum(["ok", "fallback"]),
  resultTags: z.array(z.string().min(1).max(32)).min(1).max(20)
});

export type JudgeResult = z.infer<typeof JudgeResultSchema>;
