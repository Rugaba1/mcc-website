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
    path: "/login",
    title: `Sign In | ${siteConfig.siteName}`,
    description: "Sign in to manage your account and orders with Mountain Ceramics Company.",
    noIndex: true,
  });
}
export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Login", href: "/login" },

    ]} />
    {children}</>;
}
