import { Breadcrumbs } from "@/components/breadcrumbs";
import { siteConfig } from "@/config/site.config";
import { createPageMetadata } from "@/lib/seo/metadata";
import { serverApi } from "@/lib/api";
import { Metadata } from "next";
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const count = await serverApi.getProductsNumber().catch(() => null);
    return createPageMetadata({
        locale,
        path: "/catalogue",
        title: `${count ? `${count} ` : ""}Tile Catalogue | ${siteConfig.siteName}`,
        description:
            "Browse floor, wall, outdoor, and specialty tiles manufactured by Mountain Ceramics Company in Rwanda.",
        image: "/logo.png",
    });
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
