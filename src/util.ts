export function pickTopTags(tagCounts: Record<string, number>, max = 6): string[] {
  const entries = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  return entries.slice(0, max).map((e) => e[0]);
}

export function clampText(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export function extractFirstJsonObject(text: string): string | null {
  // robust-ish extraction for "model returned extra text"
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}
