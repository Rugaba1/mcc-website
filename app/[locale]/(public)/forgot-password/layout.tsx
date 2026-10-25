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
    path: "/forgot-password",
    title: `Reset Your Password | ${siteConfig.siteName}`,
    description: "Request a secure password reset link for your Mountain Ceramics Company account.",
    noIndex: true,
  });
}
export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Login", href: "/login" },
      { label: "Forgot Password", href: "/forgot-password" },

    ]} />
    {children}</>;
}
