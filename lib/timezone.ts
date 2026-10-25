import { siteConfig } from "@/config/site.config";

export const TIME_ZONE_COOKIE_NAME = "mcc_timezone";

export function resolveTimeZone(value?: string | null) {
  if (!value) return siteConfig.defaultTimeZone;

  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value;
  } catch {
    return siteConfig.defaultTimeZone;
  }
}
