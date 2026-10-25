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
        path: "/cart",
        title: `Your Cart | ${siteConfig.siteName}`,
        description: "Review the tile products in your shopping cart.",
        noIndex: true,
    });
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
