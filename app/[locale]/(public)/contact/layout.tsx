import { Breadcrumbs } from "@/components/breadcrumbs";
import { createPageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site.config";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    path: "/contact",
    title: `Contact the Tile Manufacturer | ${siteConfig.siteName}`,
    description:
      "Contact Mountain Ceramics Company in Rwanda for product information, project support, and tile enquiries.",
  });
}

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Contact", href: "/contact" },

    ]} />
    {children}</>;
}
