// lib/colors.ts
export function parseColors(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.map(String);
  } catch {}
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
