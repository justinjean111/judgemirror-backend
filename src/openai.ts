import OpenAI from "openai";
import type { JudgePayload, JudgeResult } from "./schema";
import { JudgeResultSchema } from "./schema";
import { extractFirstJsonObject, safeJsonParse } from "./util";
import { safeFallbackResult } from "./safety";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildPrompt(payload: JudgePayload) {
  // Keep it “low-language”, entertainment-only, safe.
  // No sensitive attributes; roast the user's “style” not identity.
  const system =
    `You are JudgeMirror, a comedy mirror game.
Return ONLY valid JSON. No markdown.
Strict rules:
- Entertainment only.
- No politics, religion, race/nationality/ethnicity, hate, sex, violence, real-world conflicts.
- No medical or diagnosis claims.
- Keep English VERY simple. Short sentences.
- Funny, slightly humiliating, but harmless.
Output JSON with keys: label, roast, cta, safetyLevel, resultTags.
safetyLevel must be "ok".`;

  const user =
    `Game data:
promptIcon: ${payload.promptIcon}
chosenTags: ${payload.chosenTags.slice(0, 80).join(", ")}
responseTimeMs: ${payload.responseTimeMs.slice(0, 20).join(", ")}
othersSummaryCount: ${payload.othersSummary.length}

Create:
- label: 2-4 words
- roast: 1-2 short sentences (max 220 chars)
- cta: 2-5 words
- resultTags: 3-8 simple tags
Remember: output ONLY JSON.`;

  return { system, user };
}

function getTextFromResponse(resp: any): string {
  // OpenAI SDK response shapes can evolve. This tries multiple known shapes.
  if (typeof resp?.output_text === "string") return resp.output_text;

  // Sometimes `output` is an array of items; try to collect text fields
  if (Array.isArray(resp?.output)) {
    const parts: string[] = [];
    for (const item of resp.output) {
      // common: item.content: [{ type: "output_text", text: "..." }]
      if (Array.isArray(item?.content)) {
        for (const c of item.content) {
          if (typeof c?.text === "string") parts.push(c.text);
        }
      }
    }
    if (parts.length) return parts.join("\n");
  }

  return JSON.stringify(resp);
}

export async function judgeWithOpenAI(payload: JudgePayload): Promise<JudgeResult> {
  try {
    const built = buildPrompt(payload);

    // Responses API (text only). We instruct JSON and parse ourselves.
    const resp = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        { role: "system", content: built.system },
        { role: "user", content: built.user }
      ]
    });

    const text = getTextFromResponse(resp);
    const jsonChunk = extractFirstJsonObject(text) ?? text;
    const parsed = safeJsonParse<unknown>(jsonChunk);

    const validated = JudgeResultSchema.safeParse(parsed);
    if (!validated.success) {
      return safeFallbackResult("bad_model_json");
    }

    // Force safetyLevel ok (model might drift)
    return {
      ...validated.data,
      safetyLevel: "ok"
    };
  } catch (e) {
    console.error("OpenAI error:", e);
    return safeFallbackResult("openai_error");
  }
}
