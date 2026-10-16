import { EXPLICIT_LOCALE_PREFIX } from "@/lib/constants";

// The middleware sends `?next=/en/account`, but our router adds the locale itself.
export function safeNext(next: string | null, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  return next.replace(EXPLICIT_LOCALE_PREFIX, "/") || fallback;
}