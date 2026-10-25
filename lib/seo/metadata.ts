import type { Metadata } from "next";
import { supportedLocales } from "@/lib/constants";
import { siteConfig } from "@/config/site.config";

const localeNames: Record<string, string> = {
  en: "en_RW",
  fr: "fr_RW",
  rw: "rw_RW",
};

function localePath(locale: string, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return locale === siteConfig.defaultLanguage
    ? normalizedPath
    : `/${locale}${normalizedPath}`;
}

export function createPageMetadata({
  locale,
  path,
  title,
  description,
  image = "/logo.png",
  type = "website",
  noIndex = false,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const canonical = localePath(locale, path);
  const imageUrl = new URL(image, siteConfig.siteUrl).toString();
  const languages = Object.fromEntries(
    supportedLocales.map((supportedLocale) => [
      supportedLocale,
      new URL(
        localePath(supportedLocale, path),
        siteConfig.siteUrl,
      ).toString(),
    ]),
  );
  languages["x-default"] = new URL(
    localePath(siteConfig.defaultLanguage, path),
    siteConfig.siteUrl,
  ).toString();

  return {
    title,
    description,
    alternates: {
      canonical: new URL(canonical, siteConfig.siteUrl).toString(),
      languages,
    },
    openGraph: {
      title,
      description,
      url: new URL(canonical, siteConfig.siteUrl).toString(),
      siteName: siteConfig.siteName,
      locale: localeNames[locale] ?? locale,
      type,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
