import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/app/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { getPublishedPosts } from "@/lib/blog/queries";
import { siteConfig } from "@/config/site.config";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { createPageMetadata } from "@/lib/seo/metadata";
import { fmtDate } from "@/lib/format";

export const revalidate = 300;
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string; tag?: string }> };


export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const { locale } = await params;
    const n = Math.max(parseInt((await searchParams).page ?? "1", 10) || 1, 1);
    const title = `Tile Guides, Trends & Project Stories | ${siteConfig.siteName}`;
    const description = "Practical advice on choosing, installing and caring for ceramic and porcelain tiles in Rwanda.";
    return createPageMetadata({
        locale,
        path: n > 1 ? `/blog?page=${n}` : "/blog",
        title: n > 1 ? `${title} – Page ${n}` : title,
        description,
    });
}

export default async function BlogPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const timeZone = (await headers()).get("x-timezone") ?? siteConfig.defaultTimeZone;
    const sp = await searchParams;
    const page = Math.max(parseInt(sp.page ?? "1", 10) || 1, 1);
    const t = await getTranslations({ locale, namespace: "blog" });
    const { posts, totalPages } = await getPublishedPosts({ page, locale, tag: sp.tag });

    return (
        <main className="container mx-auto px-4 py-16">
            <Breadcrumbs items={[
                { label: "Home", href: "/" },
                { label: "Blog" },
            ]} />
            <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                    <Link key={p.id} href={`/blog/${p.slug}`}>
                        <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                            {p.coverImage && (
                                <div className="relative aspect-video">
                                    <Image src={p.coverImage} alt={p.coverAlt ?? p.title} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="line-clamp-2">{p.title}</CardTitle>
                                <CardDescription className="line-clamp-3">{p.excerpt}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
                                <time dateTime={p.publishedAt?.toISOString()}>{fmtDate(p.publishedAt, locale, timeZone)}</time>
                                <span>· {p.readingMinutes} min</span>
                                {p.tags?.split(",").slice(0, 2).map((tg) => <Badge key={tg} variant="secondary">{tg}</Badge>)}
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
            <PaginationControls
                page={page} totalPages={totalPages} basePath="/blog"
                prevLabel={t("prev")} nextLabel={t("next")} pageLabel={`${page} / ${totalPages}`}
                extraQuery={sp.tag ? { tag: sp.tag } : {}}
            />
        </main>
    );
}