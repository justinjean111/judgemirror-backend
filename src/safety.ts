const BLOCKED = [
  "politic",
  "relig",
  "race",
  "ethnic",
  "nation",
  "war",
  "conflict",
  "sexual",
  "nude",
  "porn",
  "diagnos",
  "disease",
  "mental",
  "suicide",
  "hate",
  "genocide"
];

export function isSafeText(s: string): boolean {
  const x = s.toLowerCase();
  return !BLOCKED.some((b) => x.includes(b));
}

export function safeTagList(tags: string[]): string[] {
  return tags.filter((t) => isSafeText(t)).slice(0, 16);
}

export function shouldBlockPayload(allText: string): boolean {
  return !isSafeText(allText);
}

export function safeGenericResult() {
  return {
    label: "The Confident Guesser",
    roast: "You judge people with luxury-level confidence and budget-level evidence. Respect. Slightly terrifying.",
    cta: "Share it. Let your friends get exposed too.",
    safetyLevel: "low" as const,
    resultTags: ["confident", "vibes"]
  };
}
