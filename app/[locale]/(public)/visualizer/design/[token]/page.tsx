import type { Metadata } from "next";
import { notFound } from "next/navigation";

import VisualizerClient from "../../visualizer-client";
import { routing } from "@/app/i18n/routing";
import { seoConfig } from "@/config/seo.config";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ locale: string; token: string }>;
};

async function getDesign(token: string) {
  return prisma.visualizerDesign.findUnique({
    where: { shareToken: token },
    select: {
      name: true,
      previewImage: true,
      scene: { select: { name: true, thumbnail: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, token } = await params;
  const design = await getDesign(token);
  const title = design?.name || "Shared room design";
  const description = design?.scene?.name
    ? `Explore this ${design.scene.name} tile design from Mountain Ceramics Company.`
    : "Explore a room design created with Mountain Ceramics Company’s tile visualizer.";
  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const pagePath = `${localePrefix}/visualizer/design/${encodeURIComponent(token)}`;
  const previewPath = `/api/visualizer/designs/${encodeURIComponent(token)}/preview`;
  let fallbackImage: string | undefined;
  if (design?.scene?.thumbnail) {
    try {
      fallbackImage = new URL(design.scene.thumbnail, seoConfig.siteUrl).toString();
    } catch (error) {
      console.error("Invalid visualizer scene preview URL:", error);
    }
  }
  const previewUrl = design?.previewImage
    ? new URL(previewPath, seoConfig.siteUrl).toString()
    : fallbackImage || new URL("/scenes/dining_room_1/base.jpg", seoConfig.siteUrl).toString();

  return {
    title: `${title} | ${seoConfig.siteName}`,
    description,
    alternates: { canonical: new URL(pagePath, seoConfig.siteUrl).toString() },
    openGraph: {
      title,
      description,
      url: new URL(pagePath, seoConfig.siteUrl).toString(),
      siteName: seoConfig.siteName,
      locale: locale.replace("-", "_"),
      type: "website",
      images: [
        {
          url: previewUrl,
          width: 1200,
          height: 630,
          alt: `${title} preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${seoConfig.siteName}`,
      description,
      images: [
        previewUrl,
      ],
    },
    robots: { index: false, follow: true },
  };
}

export default async function SharedVisualizerDesignPage({ params }: PageProps) {
  const { token } = await params;
  const design = await getDesign(token);
  if (!design) notFound();
  return <VisualizerClient initialDesignToken={token} />;
}
