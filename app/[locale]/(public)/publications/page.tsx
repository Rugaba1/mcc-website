import { headers } from "next/headers";
import { Link } from "@/app/i18n/routing";
import { FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site.config";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    path: "/publications",
    title: `Publications & Company News | ${siteConfig.siteName}`,
    description:
      "Read official notices, announcements, and downloadable documents published by Mountain Ceramics Company.",
    image: "/images/mcc-factory-right-angle.jpg",
  });
}

export default async function PublicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const timeZone =
    (await headers()).get("x-timezone") ?? siteConfig.defaultTimeZone;
  const now = new Date();
  const publications = await prisma.publication.findMany({
    where: {
      active: true,
      placement: { in: ["PUBLIC_PAGE", "NAVBAR_AND_PAGE", "DIALOG_AND_PAGE"] },
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      fileUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto min-h-[60vh] px-4 py-16">
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Publications" },
      ]} />

      <header className="mx-auto mt-8 max-w-3xl text-center">
        <span className="mb-4 inline-flex items-center gap-3 text-xs font-bold tracking-[0.25em] text-primary uppercase">
          <span className="h-px w-8 bg-primary" />
          Company updates
          <span className="h-px w-8 bg-primary" />
        </span>
        <h1 className="font-playfair text-4xl font-normal tracking-tight sm:text-5xl">
          Publications
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Official notices, announcements, and documents published by Mountain Ceramics Company.
        </p>
      </header>

      <section className="mt-10" aria-label="Current publications">
        {publications.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              There are no current publications.
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4">
            {publications.map((publication) => (
              <li key={publication.id}>
                <Card className="gap-0 overflow-hidden border py-0 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
                    <span className="flex size-11 shrink-0 items-center justify-center border bg-muted/50 text-primary">
                      <FileText aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        Published{" "}
                        <time dateTime={publication.createdAt.toISOString()}>
                          {fmtDate(publication.createdAt, locale, timeZone)}
                        </time>
                      </p>
                      <h2 className="mt-1 text-lg font-semibold leading-snug">
                        <Link
                          href={`/publications/${publication.slug}`}
                          className="hover:text-primary hover:underline"
                        >
                          {publication.title}
                        </Link>
                      </h2>
                      {publication.summary && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {publication.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <CardContent className="flex flex-wrap gap-2 border-t bg-muted/20 px-5 py-3 sm:justify-end sm:px-6">
                    <Button asChild variant="outline" className="rounded-none">
                      <Link href={`/publications/${publication.slug}`}>
                        View publication
                      </Link>
                    </Button>
                    {publication.fileUrl && (
                      <Button asChild variant="secondary" className="rounded-none">
                        <a
                          href={publication.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open document
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
