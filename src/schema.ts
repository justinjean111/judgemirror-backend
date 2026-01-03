import { z } from "zod";

export const JudgePayloadSchema = z.object({
  rounds: z.array(
    z.object({
      promptIcon: z.string().min(1).max(8),
      chosenTags: z.array(z.string().min(1).max(32)).max(20),
      othersSummary: z.array(z.string().min(1).max(64)).max(50),
      responseTimeMs: z.number().int().min(0).max(120000)
    })
  ).min(1).max(7)
});

export type JudgePayload = z.infer<typeof JudgePayloadSchema>;

export const JudgeResultSchema = z.object({
  label: z.string().min(1).max(60),
  roast: z.string().min(1).max(240),
  cta: z.string().min(1).max(80),
  safetyLevel: z.enum(["safe", "extra_safe"]),
  resultTags: z.array(z.string().min(1).max(32)).max(10)
});

export type JudgeResult = z.infer<typeof JudgeResultSchema>;
