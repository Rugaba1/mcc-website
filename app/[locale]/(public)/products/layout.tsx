
import { seoConfig } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { absolutizeUrl } from "@/lib/absolutize";
import { generateAlternateLinks } from "@/lib/alternates";
import { serverApi } from "@/lib/api";
import { Metadata } from "next";
import { Suspense } from "react";



export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let products;
  try {
    products = (await serverApi.getProductsNumber())

  } catch (error) {

  }


  const title = `${products && `(${products})`} Tiles for Every Space Style | ${siteConfig.siteName}`;
  const description = `From classic ceramics to modern large-format porcelain — covering every design vision.`;
  const url = `${seoConfig.siteUrl}${`/${locale}`}/products/ `;

  const thumb = absolutizeUrl(`/products/apollo-grey.jpg`)
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

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>

    <Suspense fallback={<section id="products" className="py-24">
      <div className="max-w-7xl mx-auto px-6 text-center py-20  text-sm animate-pulse">
        Loading collections…
      </div>
    </section>}>

      {children}
    </Suspense></>;
}
