import { Breadcrumbs } from "@/components/breadcrumbs";
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
      path: "/projects",
      title: `Tile Projects in Rwanda | ${siteConfig.siteName}`,
      description:
          "Explore residential, hospitality, commercial, and infrastructure projects featuring tiles manufactured in Rwanda.",
      image: "/images/mcc-factory-right-angle.jpg",
  });
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>
  <Breadcrumbs items={[
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
  ]} />
  {children}
  </>;
}
