import OpenAI from "openai";
import { JudgePayload, JudgeResultSchema } from "./schema";
import { extractFirstJsonObject, clampText, pickTopTags } from "./util";
import { safeGenericResult, safeTagList, shouldBlockPayload } from "./safety";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildPrompt(payload: JudgePayload) {
  // Flatten into simple, safe text (no faces, no politics, no identity).
  const summary = payload.rounds.map((r, idx) => {
    const chosen = safeTagList(r.chosenTags);
    const othersTop = pickTopTags(r.othersSummary.tagCounts, 6).filter(Boolean);
    return `Round ${idx + 1}: prompt=${r.promptIcon} "${r.promptLabelEasy}", chosenTags=${chosen.join(
      ","
    )}, othersTopTags=${othersTop.join(",")}, timeMs=${r.responseTimeMs}`;
  });

  const allText = summary.join("\n");

  if (shouldBlockPayload(allText)) return null;

  // Force strict JSON in the output via instructions (server validates with Zod).
  const system = `
You generate a safe, funny, humiliating (but harmless) "bias mirror" result.
STRICT RULES:
- Entertainment only. No politics, no religion, no race/nationality/ethnicity, no hate, no sexual content, no real-world conflicts, no medical/diagnosis claims.
- Use very easy English. Short sentences. No complex words.
- The roast is playful, not cruel. No slurs. No threats. No targeting protected traits.
- Output MUST be a single JSON object ONLY. No markdown. No extra text.

Schema:
{
  "label": string (2-40),
  "roast": string (10-260),
  "cta": string (3-80),
  "safetyLevel": "low" | "medium",
  "resultTags": string[] (max 12)
}
`;

  const user = `
Here are 7 rounds. Infer a funny "bias" about the user:
${allText}

Make it feel premium + viral. Roast should be shareable.
Return JSON ONLY.
`;

  return { system, user };
}

export async function judgeWithOpenAI(payload: JudgePayload) {
  const built = buildPrompt(payload);
  if (!built) return safeGenericResult();

  try {
    // Responses API (text-only). We request JSON by instruction and parse ourselves.
    const resp = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        { role: "system", content: built.system },
        { role: "user", content: built.user }
      ],
      // If supported in your org/account, keep logs off:
      // @ts-expect-error - some SDK versions may not type this yet
      store: false
    });

    // Try to get text output safely
    const text =
      // @ts-expect-error - SDK output shape may vary by version
      resp.output_text ||
      // fallback: try common shape
      JSON.stringify(resp);

    const jsonStr = extractFirstJsonObject(String(text));
    if (!jsonStr) return safeGenericResult();

    const parsed = JSON.parse(jsonStr);
    const validated = JudgeResultSchema.safeParse(parsed);
    if (!validated.success) return safeGenericResult();

    // clamp lengths defensively
    return {
      ...validated.data,
      label: clampText(validated.data.label, 40),
      roast: clampText(validated.data.roast, 260),
      cta: clampText(validated.data.cta, 80),
      resultTags: validated.data.resultTags.slice(0, 12)
    };
  } catch {
    return safeGenericResult();
  }
}
