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
    path: "/register",
    title: `Create an Account | ${siteConfig.siteName}`,
    description: "Create an account to manage orders and save your favorite tile products.",
    noIndex: true,
  });
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Register", href: "/register" },

    ]} />
    {children}</>;
}
