import { supportedLocales } from "@/lib/constants";
import { siteConfig } from "@/config/site.config";

export function localizedUrl(locale: string, path = "") {
  const prefix = locale === siteConfig.defaultLanguage ? "" : `/${locale}`;
  const normalizedPath = path ? `/${path.replace(/^\/+|\/+$/g, "")}` : "";
  return new URL(`${prefix}${normalizedPath}`, siteConfig.siteUrl).toString();
}

export function generateAlternateLinks(_currentLocale: string, path = "") {
  const alternates: Record<string, string> = {};
  supportedLocales.forEach((lang) => {
    alternates[lang] = localizedUrl(lang, path);
  });
  alternates["x-default"] = localizedUrl(siteConfig.defaultLanguage, path);
  return alternates;
}