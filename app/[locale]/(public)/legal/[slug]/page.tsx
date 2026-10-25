import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getLocalizedLegalContent, getPublishedLegalDocuments, legalDocumentFromSlug } from "@/lib/legal/documents";
import { createPageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site.config";
import { headers } from "next/headers";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

async function getLegalPage(locale: string, slug: string) {
  const definition = legalDocumentFromSlug(slug);
  if (!definition) return null;
  const version = (await getPublishedLegalDocuments()).get(definition.type);
  if (!version) return null;
  return {
    definition,
    version,
    content: getLocalizedLegalContent(version, locale),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const document = await getLegalPage(locale, slug);
  const title = document
    ? `${document.content.title} | ${siteConfig.siteName}`
    : `Legal information | ${siteConfig.siteName}`;
  const description = document
    ? `${document.content.title}, version ${document.version.version}.`
    : "Legal information from Mountain Ceramics Company.";
  return createPageMetadata({
    locale,
    path: `/legal/${slug}`,
    title,
    description,
    type: "article",
    noIndex: !document,
  });
}

export default async function LegalDocumentPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const document = await getLegalPage(locale, slug);
  if (!document) notFound();
  const timeZone = (await headers()).get("x-timezone") ?? siteConfig.defaultTimeZone;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: document.content.title },
      ]} />
      <header className="mb-10 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{document.content.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Version {document.version.version}
          {document.version.publishedAt
            ? ` · Updated ${fmtDate(document.version.publishedAt, locale, timeZone)}`
            : ""}
        </p>
      </header>
      <article className="prose prose-neutral max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {document.content.contentMarkdown}
        </ReactMarkdown>
      </article>
    </main>
  );
}
