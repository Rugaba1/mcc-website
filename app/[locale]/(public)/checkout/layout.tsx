import { Breadcrumbs } from "@/components/breadcrumbs";
import { createPageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site.config";
import type { Metadata } from "next";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return createPageMetadata({
      locale,
      path: "/checkout",
      title: `Finish Your Order | ${siteConfig.siteName}`,
      description: "Complete your tile order with Mountain Ceramics Company.",
      noIndex: true,
    });
}

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
    return <>
        <Breadcrumbs items={[
            { label: "Home", href: "/" },
            { label: "My order", href: "/cart" },
            { label: "Finish ordering", href: "/checkout" },

        ]} />
        {children}
    </>;
}
