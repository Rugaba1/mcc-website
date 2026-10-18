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


  const title = `Project Portfolio | ${siteConfig.siteName}`;
  const description = ` Tiles shaping Rwanda's most iconic spaces. Click any project to see
            which tiles were used — and visualize them in your own space.`;
  const url = `${seoConfig.siteUrl}${`/${locale}`}/about-us/ `;

  const thumb = absolutizeUrl(`/logo.png`)
  const image = thumb ?? `${seoConfig.siteUrl}/logo.png`;

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
  return <Suspense fallback={<div className="min-h-screen bg-dark flex items-center justify-center">
    <div className="/50 text-sm animate-pulse">Loading projects…</div>
  </div>}>
     <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Projects", href: "/projects" },
    
        ]} />
    {children}</Suspense>;
}
