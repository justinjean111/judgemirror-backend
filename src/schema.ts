import { z } from "zod";

export const JudgePayloadSchema = z.object({
  rounds: z
    .array(
      z.object({
        promptIcon: z.string().min(1).max(8),
        promptLabelEasy: z.string().min(1).max(64),
        chosenTags: z.array(z.string().min(1).max(24)).max(20),
        othersSummary: z.object({
          tagCounts: z.record(z.string(), z.number().int().nonnegative())
        }),
        responseTimeMs: z.number().int().nonnegative().max(120000)
      })
    )
    .length(7)
});

export const JudgeResultSchema = z.object({
  label: z.string().min(2).max(40),
  roast: z.string().min(10).max(260),
  cta: z.string().min(3).max(80),
  safetyLevel: z.enum(["low", "medium"]),
  resultTags: z.array(z.string().min(1).max(24)).max(12)
});

export type JudgePayload = z.infer<typeof JudgePayloadSchema>;
export type JudgeResult = z.infer<typeof JudgeResultSchema>;
