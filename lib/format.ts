import { isValid, parseISO } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { fr } from "date-fns/locale/fr";
import { formatInTimeZone } from "date-fns-tz";
import { siteConfig } from "@/config/site.config";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
const monthOnlyPattern = /^\d{4}-\d{2}$/;

function parseDate(value: string | Date, dateOnlyAsUtc = false) {
  if (value instanceof Date) return value;
  const input = dateOnlyAsUtc
    ? `${value}${dateOnlyPattern.test(value) ? "T00:00:00.000Z" : monthOnlyPattern.test(value) ? "-01T00:00:00.000Z" : ""}`
    : value;
  return parseISO(input);
}

function dateLocale(locale: string) {
  return locale.split("-")[0] === "fr" ? fr : enUS;
}

export function formatNumber(
  value: number,
  locale = siteConfig.defaultLanguage,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function money(
  value: number,
  currency = siteConfig.defaultCurrency,
  locale = siteConfig.defaultLanguage,
  decimalDigits?: number,
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    ...(decimalDigits === undefined
      ? {}
      : {
          minimumFractionDigits: decimalDigits,
          maximumFractionDigits: decimalDigits,
        }),
  }).format(value);
}

export function fmtDate(
  value?: string | Date | null,
  locale = siteConfig.defaultLanguage,
  timeZone = siteConfig.defaultTimeZone,
) {
  if (!value) return "—";
  const dateOnly = typeof value === "string" && dateOnlyPattern.test(value);
  const date = parseDate(value, dateOnly);
  if (!isValid(date)) return "—";
  return formatDatePattern(
    date,
    "d MMM yyyy",
    locale,
    dateOnly ? "UTC" : timeZone,
  );
}

export function formatDatePattern(
  value: string | Date,
  pattern: string,
  locale = siteConfig.defaultLanguage,
  timeZone = siteConfig.defaultTimeZone,
) {
  const dateOnly =
    typeof value === "string" &&
    (dateOnlyPattern.test(value) || monthOnlyPattern.test(value));
  const date = parseDate(value, dateOnly);
  if (!isValid(date)) return "—";
  timeZone = dateOnly ? "UTC" : timeZone;

  if (locale.split("-")[0] === "rw") {
    const options: Intl.DateTimeFormatOptions =
      pattern === "MMM"
        ? { month: "short" }
        : pattern === "MMMM yyyy"
          ? { month: "long", year: "numeric" }
          : { day: "numeric", month: "short", year: "numeric" };
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  }
  return formatInTimeZone(date, timeZone, pattern, { locale: dateLocale(locale) });
}

export function fmtDateTime(
  value?: string | Date | null,
  locale = siteConfig.defaultLanguage,
  timeZone = siteConfig.defaultTimeZone,
) {
  if (!value) return "—";
  const date = parseDate(value);
  if (!isValid(date)) return "—";

  if (locale.split("-")[0] === "rw") {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    }).format(date);
  }
  return formatInTimeZone(date, timeZone, "d MMM yyyy, HH:mm", { locale: dateLocale(locale) });
}

/** "MTN_MOMO" → "Mtn momo" */
export const pretty = (s: string) => {
  const t = s.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const options = (values: string[]) =>
  values.map((v) => ({ value: v, label: pretty(v) }));
