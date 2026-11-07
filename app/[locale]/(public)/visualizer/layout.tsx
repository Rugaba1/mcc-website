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
    path: "/visualizer",
    title: `Tile Visualizer | ${siteConfig.siteName}`,
    description:
      "Preview Mountain Ceramics tile designs in realistic rooms with the interactive tile visualizer.",
    image: "/scenes/dining_room_1/base.jpg",
  });
}


export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Visualizer", href: "/visualizer" },

    ]} />
    {children}</>;
}
