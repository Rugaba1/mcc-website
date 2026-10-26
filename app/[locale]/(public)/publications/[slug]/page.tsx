import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { PublicationContent } from "@/components/publications-surface";
import { siteConfig } from "@/config/site.config";
import { prisma } from "@/lib/prisma";
import { createPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

const getPublication = cache(async (slug: string) => {
  const now = new Date();
  return prisma.publication.findFirst({
    where: {
      slug,
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
  });
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const publication = await getPublication(slug);
  if (!publication) {
    return createPageMetadata({
      locale,
      path: `/publications/${slug}`,
      title: `Publication not found | ${siteConfig.siteName}`,
      description: "This publication could not be found.",
      noIndex: true,
    });
  }

  return createPageMetadata({
    locale,
    path: `/publications/${publication.slug}`,
    title: `${publication.title} | ${siteConfig.siteName}`,
    description: publication.summary || publication.title,
    image: publication.coverImage || "/logo.png",
    type: "article",
  });
}

export default async function PublicationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const publication = await getPublication(slug);
  if (!publication) notFound();

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Publications", href: "/publications" },
          { label: publication.title },
        ]}
      />
      <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <PublicationContent
          publication={{
            ...publication,
            startsAt: publication.startsAt?.toISOString() ?? null,
            endsAt: publication.endsAt?.toISOString() ?? null,
            createdAt: publication.createdAt.toISOString(),
            updatedAt: publication.updatedAt.toISOString(),
          }}
        />
      </main>
    </>
  );
}
