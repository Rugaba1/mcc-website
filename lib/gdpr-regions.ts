// ISO 3166-1 alpha-2 codes where GDPR (EU/EEA) or UK GDPR applies.
// Used to decide who sees the cookie consent gate before anything
// non-essential (analytics, marketing) is allowed to load.
export const GDPR_COUNTRY_CODES = new Set([
  // EU member states
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  // EEA (non-EU)
  "IS", "LI", "NO",
  // UK GDPR
  "GB",
]);

export function isGdprCountry(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return GDPR_COUNTRY_CODES.has(countryCode.toUpperCase());
}
