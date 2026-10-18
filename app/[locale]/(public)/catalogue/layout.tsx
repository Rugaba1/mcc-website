import { Breadcrumbs } from "@/components/breadcrumbs";
import { seoConfig } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { absolutizeUrl } from "@/lib/absolutize";
import { generateAlternateLinks } from "@/lib/alternates";
import { serverApi } from "@/lib/api";
import { Metadata } from "next";
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


    const title = `${products && `(${products})`} Tile Catalogues | ${siteConfig.siteName}`;
    const description = `Browse our full range of floor, wall, outdoor and specialty tiles.
                Click any tile to visualize it in your space.`;
    const url = `${seoConfig.siteUrl}${`/${locale}`}/catalogue/ `;

    const thumb = absolutizeUrl(`/scenes/bathroom_3/base.jpg`)
    const image = thumb ?? `${seoConfig.siteUrl}/scenes/bathroom_3/base.jpg`;

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

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
    return <>
        <Breadcrumbs items={[
            { label: "Home", href: "/" },
            { label: "Catalogue", href: "/catalogue" },

        ]} />
        {children}
    </>;
}
