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
    path: "/verify-email",
    title: `Email Verification | ${siteConfig.siteName}`,
    description: "Verify your email address to finish setting up your account.",
    noIndex: true,
  });
}

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
