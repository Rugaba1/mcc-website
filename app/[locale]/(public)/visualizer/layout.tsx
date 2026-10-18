import { Breadcrumbs } from "@/components/breadcrumbs";
import { seoConfig } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { absolutizeUrl } from "@/lib/absolutize";
import { generateAlternateLinks } from "@/lib/alternates";
import type { Metadata } from "next";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;


  const title = `Tile Visualizer | ${siteConfig.siteName}`;
  const description = `"Browse MCC tiles . Select a collection to visualize tiles in a real room."`;
  const url = `${seoConfig.siteUrl}${`/${locale}`}/products/ `;

  const thumb = absolutizeUrl(`/scenes/dining_room_1/base.jpg`)
  const image = thumb ?? `${seoConfig.siteUrl}/products/apollo-grey.jpg`;

  return {
    title,
    description,
    openGraph: {
      title, description, url, siteName: seoConfig.siteName, locale: locale.replace("-", "_"), type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: url, languages: generateAlternateLinks(locale, `/products`) },
    robots: { index: true, follow: true },
  };
}


export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Visualizer", href: "/visualizer" },

    ]} />
    {children}</>;
}
