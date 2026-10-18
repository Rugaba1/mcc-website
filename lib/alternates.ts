import { seoConfig } from "@/config/seo.config";

export function localizedUrl(locale: string, path = "") {
  const prefix = locale === seoConfig.defaultLanguage ? "" : `/${locale}`;
  return `${seoConfig.siteUrl}${prefix}${path.replace(/\/+$/, "")}`;
}

export function generateAlternateLinks(_currentLocale: string, path = "") {
  const alternates: Record<string, string> = {};
  seoConfig.languages.forEach((lang) => {
    alternates[lang] = localizedUrl(lang, path);
  });
  alternates["x-default"] = localizedUrl(seoConfig.defaultLanguage, path);
  return alternates;
}