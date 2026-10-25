import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { LEGAL_DOCUMENTS } from "@/lib/legal/constants";
import { localizedUrl, generateAlternateLinks } from "@/lib/alternates";
import { supportedLocales } from "@/lib/constants";

const staticPaths = [
  "/",
  "/about",
  "/why-us",
  "/products",
  "/catalogue",
  "/collections",
  "/projects",
  "/blog",
  "/contact",
];

function localizedEntries(
  path: string,
  lastModified: Date = new Date(),
  priority = 0.7,
): MetadataRoute.Sitemap {
  return supportedLocales.map((locale) => ({
    url: localizedUrl(locale, path),
    lastModified,
    changeFrequency: "weekly",
    priority,
    alternates: { languages: generateAlternateLinks(locale, path) },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsResult, postsResult, legalResult] = await Promise.allSettled([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      select: { slug: true, locale: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.legalDocumentVersion.findMany({
      where: { publishedAt: { not: null } },
      select: { documentType: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  if (productsResult.status === "rejected") {
    console.error("Could not load products for sitemap:", productsResult.reason);
  }
  if (postsResult.status === "rejected") {
    console.error("Could not load blog posts for sitemap:", postsResult.reason);
  }
  if (legalResult.status === "rejected") {
    console.error("Could not load legal documents for sitemap:", legalResult.reason);
  }

  const products =
    productsResult.status === "fulfilled" ? productsResult.value : [];
  const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
  const legalDocuments =
    legalResult.status === "fulfilled" ? legalResult.value : [];

  const staticEntries = staticPaths.flatMap((path) =>
    localizedEntries(path, new Date(), path === "/" ? 1 : 0.7),
  );
  const productEntries = products.flatMap(({ slug, updatedAt }) =>
    slug ? localizedEntries(`/products/${slug}`, updatedAt, 0.8) : [],
  );
  const blogEntries = posts.map(({ slug, locale, updatedAt }) => ({
    url: localizedUrl(locale, `/blog/${slug}`),
    lastModified: updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const legalEntries = legalDocuments.flatMap(({ documentType, publishedAt }) => {
    const document = LEGAL_DOCUMENTS.find(({ type }) => type === documentType);
    return document
      ? localizedEntries(`/legal/${document.slug}`, publishedAt ?? new Date(), 0.3)
      : [];
  });

  return [...staticEntries, ...productEntries, ...blogEntries, ...legalEntries];
}
