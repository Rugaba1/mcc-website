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
    path: "/why-us",
    title: `Why Choose Our Tiles | ${siteConfig.siteName}`,
    description:
      "Learn about Mountain Ceramics Company's tile manufacturing quality, standards, product durability, and regional project experience.",
  });
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Why Us", href: "/why-us" },

    ]} />
    {children}</>;
}
