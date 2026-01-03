import type { JudgePayload } from "./schema";

const DISALLOWED = [
  // politics / religion
  "president", "election", "politics", "religion", "muslim", "christian", "jew", "hindu", "buddhist",
  // race / ethnicity / nationality
  "race", "ethnicity", "nationality", "african", "asian", "white", "black", "arab", "latino",
  // hate / slurs (keep it light; add more if needed)
  "nazi",
  // sexual content
  "sex", "porn", "nude", "naked",
  // medical / diagnosis
  "autism", "adhd", "depression", "bipolar", "diagnosis", "disease"
];

function containsBlocked(text: string) {
  const t = text.toLowerCase();
  return DISALLOWED.some(w => t.includes(w));
}

export function isBlockedPayload(payload: JudgePayload): boolean {
  for (const r of payload.rounds) {
    if (containsBlocked(r.promptIcon)) return true;
    for (const tag of r.chosenTags) if (containsBlocked(tag)) return true;
    for (const s of r.othersSummary) if (containsBlocked(s)) return true;
  }
  return false;
}

export function safeFallbackResult() {
  return {
    label: "Certified Overthinker",
    roast: "You judge fast… but your brain still asks for a second opinion from itself.",
    cta: "Share your result and expose yourself.",
    safetyLevel: "extra_safe" as const,
    resultTags: ["overthink", "fast-judge", "dramatic"]
  };
}
