import { seoConfig } from "@/config/seo.config";

 
export function absolutizeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//.test(url) ? url : `${seoConfig.siteUrl}${url}`;
}
