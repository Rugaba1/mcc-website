
import { siteConfig } from "@/config/site.config";
import { createPageMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    path: "/products",
    title: `Floor, Wall & Outdoor Tiles | ${siteConfig.siteName}`,
    description:
      "Explore ceramic and porcelain floor, wall, outdoor, and specialty tiles manufactured in Rwanda.",
    image: "/images/mcc-products.jpg",
  });
}

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
