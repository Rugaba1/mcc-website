// Shared helpers for the admin + customer dashboards.
// All date bucketing is done in UTC.

export const num = (v: unknown): number => (v == null ? 0 : Number(v));
export const round = (n: number, d = 2) => Number(n.toFixed(d));

export const pctChange = (current: number, previous: number): number => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return round(((current - previous) / previous) * 100, 1);
};

export const fullName = (
  u?: { firstName?: string | null; lastName?: string | null } | null,
) => (u ? [u.firstName, u.lastName].filter(Boolean).join(" ") : "Guest");

/** Start of the day (UTC), `n` days ago. daysAgo(0) = today 00:00 */
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

/** First day (UTC) of the month, `n` months ago. monthsAgoStart(0) = this month */
export const monthsAgoStart = (n: number) => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, 1));
};

export const dayKey = (d: Date) => d.toISOString().slice(0, 10);
export const monthKey = (d: Date) => d.toISOString().slice(0, 7);

export const dayKeys = (n: number) =>
  Array.from({ length: n }, (_, i) => dayKey(daysAgo(n - 1 - i)));

export const monthKeys = (n: number) =>
  Array.from({ length: n }, (_, i) => monthKey(monthsAgoStart(n - 1 - i)));

/** `?days=` → clamped to 7..365 (default 30) */
export const parseDays = (params: URLSearchParams, fallback = 30) => {
  const n = Number(params.get("days") ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(365, Math.max(7, Math.floor(n)));
};

/** Zero-filled time series so charts never have gaps. */
export function buildSeries<T>(
  keys: string[],
  fields: string[],
  rows: T[],
  keyOf: (row: T) => string,
  valuesOf: (row: T) => Record<string, number>,
) {
  const map = new Map<string, Record<string, number | string>>(
    keys.map((k) => [
      k,
      { label: k, ...Object.fromEntries(fields.map((f) => [f, 0])) },
    ]),
  );
  for (const row of rows) {
    const bucket = map.get(keyOf(row));
    if (!bucket) continue;
    const values = valuesOf(row);
    for (const f of fields)
      bucket[f] = (bucket[f] as number) + (values[f] ?? 0);
  }
  return keys.map((k) => {
    const b = map.get(k)!;
    for (const f of fields) b[f] = round(b[f] as number);
    return b;
  });
}

/** Pie/donut data with percentages. */
export function toPie(items: { label: string; value: number }[]) {
  const total = items.reduce((s, i) => s + i.value, 0);
  return items
    .filter((i) => i.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((i) => ({
      ...i,
      value: round(i.value),
      percentage: total ? round((i.value / total) * 100, 1) : 0,
    }));
}

export type CardFormat = "currency" | "number" | "percent";

export const card = (
  key: string,
  label: string,
  value: number,
  format: CardFormat = "number",
  previous?: number,
) => ({
  key,
  label,
  value: round(value),
  format,
  ...(previous !== undefined && {
    previous: round(previous),
    change: pctChange(value, previous),
  }),
});

export const titleCase = (s: string) =>
  s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
