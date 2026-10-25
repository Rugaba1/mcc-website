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
    path: "/legal/accept",
    title: `Review Legal Documents | ${siteConfig.siteName}`,
    description: "Review the current legal documents for your account.",
    noIndex: true,
  });
}

export default function LegalAcceptanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
