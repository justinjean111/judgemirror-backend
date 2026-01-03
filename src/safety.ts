import type { JudgePayload } from "./schema";
import type { JudgeResult } from "./schema";

// You said: no politics, religion, race/nationality/ethnicity, hate, sexual content,
// conflicts, medical/diagnosis claims.
// We’ll block risky words defensively (simple MVP filter).
const BLOCKLIST = [
  "president", "election", "politic", "government",
  "religion", "jesus", "allah", "quran", "bible", "church", "mosque",
  "race", "racial", "ethnic", "nationality", "immigrant",
  "sex", "sexy", "nude", "porn",
  "war", "terror", "genocide",
  "diagnos", "autis", "schizo", "bipolar", "adhd", "depress",
  "cancer", "disease"
];

function containsBlockedText(text: string) {
  const t = text.toLowerCase();
  return BLOCKLIST.some((w) => t.includes(w));
}

export function isPayloadSafe(payload: JudgePayload): boolean {
  if (containsBlockedText(payload.promptIcon)) return false;
  for (const t of payload.chosenTags) if (containsBlockedText(t)) return false;

  for (const row of payload.othersSummary) {
    for (const t of row.shownTags) if (containsBlockedText(t)) return false;
  }
  return true;
}

export function safeFallbackResult(reason: string): JudgeResult {
  // Safe, non-sensitive, “humiliating but harmless”
  const options = [
    {
      label: "Certified Overthinker",
      roast: "You don’t choose a face. You choose a whole life story in 0.3 seconds… and still feel unsure.",
      cta: "Share your mirror",
      resultTags: ["overthinker", "vibes"]
    },
    {
      label: "Vibe Detective",
      roast: "Your brain said “evidence.” Your finger said “nah, vibes.” And honestly… it worked.",
      cta: "Roast me again",
      resultTags: ["vibes", "intuition"]
    },
    {
      label: "Confidence Collector",
      roast: "You keep picking the ones who look like they know things… because you want to borrow their aura.",
      cta: "Show the result",
      resultTags: ["confidence", "aura"]
    }
  ];

  const pick = options[Math.floor(Math.random() * options.length)];
  return {
    label: pick.label,
    roast: `${pick.roast} (offline: ${reason})`,
    cta: pick.cta,
    safetyLevel: "fallback",
    resultTags: pick.resultTags
  };
}
