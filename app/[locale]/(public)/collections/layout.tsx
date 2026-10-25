import { Breadcrumbs } from "@/components/breadcrumbs";
import { siteConfig } from "@/config/site.config";
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


  return createPageMetadata({
    locale,
    path: "/collections",
    title: `Tile Collections | ${siteConfig.siteName}`,
    description:
      "Discover curated ceramic and porcelain tile collections, organized by design, finish, and use.",
  });
}
export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Suspense fallback={<LuxuryLoading fullScreen label="Loading collections" />}>
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Collections", href: "/collections" },

      ]} />
      {children}</Suspense>
    </>;
}
