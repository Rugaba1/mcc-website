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
    path: "/projects",
    title: `Tile Projects in Rwanda | ${siteConfig.siteName}`,
    description:
      "Explore residential, hospitality, commercial, and infrastructure projects featuring tiles manufactured in Rwanda.",
  });
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LuxuryLoading fullScreen label="Loading projects" />}>
     <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
    
        ]} />
    {children}</Suspense>;
}
