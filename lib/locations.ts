// src/lib/locations.ts
import raw from "@/lib/data/rwanda-locations.json";

// Province > District > Sector > Cell > Villages[]
type Tree = Record<
  string,
  Record<string, Record<string, Record<string, string[]>>>
>;
const tree = raw as unknown as Tree;

export type Opt = { value: string; label: string };

const PROVINCE_LABELS: Record<string, string> = {
  East: "Eastern Province",
  Kigali: "Kigali City",
  North: "Northern Province",
  South: "Southern Province",
  West: "Western Province",
};

const byName = (a: string, b: string) => a.localeCompare(b);

// province -> district -> sector[]  (Maps avoid prototype-key surprises like "constructor")
const index = new Map<string, Map<string, string[]>>();
for (const [province, districts] of Object.entries(tree)) {
  const dm = new Map<string, string[]>();
  for (const [district, sectors] of Object.entries(districts)) {
    dm.set(district, Object.keys(sectors).sort(byName));
  }
  index.set(province, dm);
}

const toOpts = (names: string[]): Opt[] =>
  names.map((n) => ({ value: n, label: n }));

export const getProvinces = (): Opt[] =>
  [...index.keys()]
    .map((p) => ({ value: p, label: PROVINCE_LABELS[p] ?? p }))
    .sort((a, b) => byName(a.label, b.label));

export const getDistricts = (province: string): Opt[] | null => {
  const dm = index.get(province);
  return dm ? toOpts([...dm.keys()].sort(byName)) : null;
};

export const getSectors = (
  province: string,
  district: string,
): Opt[] | null => {
  const sectors = index.get(province)?.get(district);
  return sectors ? toOpts(sectors) : null;
};

export function isValidLocation(
  province: string,
  district: string,
  sector?: string,
) {
  const sectors = index.get(province)?.get(district);
  if (!sectors) return false;
  return !sector || sectors.includes(sector);
}
