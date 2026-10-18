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


    const title = `Your cart  | ${siteConfig.siteName}`;
    const description = `Browse our tiles and add what you like.`;
    const url = `${seoConfig.siteUrl}${`/${locale}`}/cart/ `;

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


export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
    return <>
        <Breadcrumbs items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },

        ]} />
        {children}
    </>;
}
