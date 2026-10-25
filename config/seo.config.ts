import { siteConfig } from "@/config/site.config";
import { supportedLocales } from "@/lib/constants";

export const seoConfig = {
  siteName: siteConfig.siteName,
  siteUrl: siteConfig.siteUrl,
  defaultLanguage: siteConfig.defaultLanguage,
  languages: supportedLocales,
};