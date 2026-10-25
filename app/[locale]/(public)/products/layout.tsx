
import { siteConfig } from "@/config/site.config";
import { serverApi } from "@/lib/api";
import { createPageMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LuxuryLoading } from "@/components/luxury-loading";



export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const count = await serverApi.getProductsNumber().catch(() => null);
  const title = `${count ? `${count} ` : ""}Floor, Wall & Outdoor Tiles | ${siteConfig.siteName}`;
  return createPageMetadata({
    locale,
    path: "/products",
    title,
    description:
      "Explore ceramic and porcelain floor, wall, outdoor, and specialty tiles manufactured in Rwanda.",
    image: "/logo.png",
  });
}

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>

    <Suspense fallback={<LuxuryLoading fullScreen label="Loading products" />}>

      {children}
    </Suspense></>;
}
