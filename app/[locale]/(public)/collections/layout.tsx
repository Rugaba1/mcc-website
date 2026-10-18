import { Breadcrumbs } from "@/components/breadcrumbs";
import { seoConfig } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { absolutizeUrl } from "@/lib/absolutize";
import { generateAlternateLinks } from "@/lib/alternates";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;


  const title = `Browse by Collection | ${siteConfig.siteName}`;
  const description = `  Each collection brings together tiles with a shared design language.
          Select any collection to explore its tiles and visualize them in a real room.`;
    const url = `${seoConfig.siteUrl}${`/${locale}`}/collections/ `;

  const thumb = absolutizeUrl(`/tiles/tik-wood-red-.jpg`)
  const image = thumb ?? `${seoConfig.siteUrl}/tiles/tik-wood-red-.jpg`;

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
export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Suspense fallback={<div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="/50 text-sm animate-pulse">Loading collections…</div>
    </div>}>
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Collections", href: "/collections" },

      ]} />
      {children}</Suspense>
    </>;
}
