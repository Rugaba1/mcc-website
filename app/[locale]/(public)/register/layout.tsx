import { Breadcrumbs } from "@/components/breadcrumbs";
import { seoConfig } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { absolutizeUrl } from "@/lib/absolutize";
import { generateAlternateLinks } from "@/lib/alternates";
import type { Metadata } from "next";
import { exp } from "three/src/nodes/math/MathNode.js";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;



  const title = `Create your account | ${siteConfig.siteName}`;
  const description = `Track orders and save your favourite tiles`;
  const url = `${seoConfig.siteUrl}${`/${locale}`}/login/ `;

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
    alternates: { canonical: url, languages: generateAlternateLinks(locale, `/catalogue`) },
    robots: { index: true, follow: true },
  };
}
exp
export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Register", href: "/register" },

    ]} />
    {children}</>;
}
