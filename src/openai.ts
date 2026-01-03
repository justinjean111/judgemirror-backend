import OpenAI from "openai";
import { JudgePayloadSchema, JudgeResultSchema, type JudgePayload, type JudgeResult } from "./schema";
import { extractFirstJsonObject, safeJsonParse } from "./util";
import { safeFallbackResult } from "./safety";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildPrompt(payload: JudgePayload) {
  // Keep it extremely simple English, global friendly, no sensitive areas.
  // We do NOT mention race/politics/religion/sex/medical.
  const summary = payload.rounds.map((r, i) => ({
    round: i + 1,
    icon: r.promptIcon,
    chosenTags: r.chosenTags,
    others: r.othersSummary.slice(0, 6),
    timeMs: r.responseTimeMs
  }));

  const system =
    `You are JudgeMirror, a playful roast generator for a mobile game.
Rules:
- Entertainment only. Do NOT mention politics, religion, race/nationality/ethnicity, sexual content, real-world conflicts, medical/diagnosis.
- No hate. No threats. No bullying about protected traits. No self-harm content.
- Keep English VERY easy for non-native speakers.
- Output MUST be a single JSON object only. No extra text.

JSON schema:
{
  "label": string (1-60),
  "roast": string (1-240) funny + humiliating but safe,
  "cta": string (1-80) simple share call,
  "safetyLevel": "safe" | "extra_safe",
  "resultTags": string[] (0-10)
}`;

  const user =
    `Game data (7 rounds max):
${JSON.stringify(summary)}

Task:
Make a short funny "bias" result about the user.
Make it feel like: "you always pick X so you are Y".
Keep it safe and non-sensitive.
Return ONLY JSON.`;

  return { system, user };
}

export async function judgeWithOpenAI(payloadRaw: unknown): Promise<JudgeResult> {
  const parsed = JudgePayloadSchema.safeParse(payloadRaw);
  if (!parsed.success) return safeFallbackResult();

  const payload = parsed.data;
  const built = buildPrompt(payload);

  try {
    const resp = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        { role: "system", content: built.system },
        { role: "user", content: built.user }
      ],
      store: false
    });

    const text = (resp as any).output_text ?? JSON.stringify(resp);
    const jsonBlock = extractFirstJsonObject(text) ?? text;
    const j = safeJsonParse<unknown>(jsonBlock);

    if (!j.ok) return safeFallbackResult();

    const out = JudgeResultSchema.safeParse(j.value);
    if (!out.success) return safeFallbackResult();
    return out.data;
  } catch {
    return safeFallbackResult();
  }
}
