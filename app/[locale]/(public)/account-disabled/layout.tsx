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
    path: "/account-disabled",
    title: `Account Access | ${siteConfig.siteName}`,
    description: "Get help with access to your Mountain Ceramics Company account.",
    noIndex: true,
  });
}

export default function AccountDisabledLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
