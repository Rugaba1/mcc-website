import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MdxContent } from "@/components/blog/mdx-content";
import { getPostBySlug } from "@/lib/blog/queries";
import { absolutizeUrl } from "@/lib/absolutize";
import { seoConfig } from "@/config/seo.config";

export const revalidate = 300;
const SITE = process.env.NEXT_PUBLIC_SITE_URL!;
type Props = { params: Promise<{ locale: string; slug: string }> };
const load = cache(getPostBySlug); // dedupes between generateMetadata and the page

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale, slug } = await params;
    const post = await load(slug);
    if (!post) return {};
    const title = post.seoTitle || post.title;
    const description = post.seoDescription || post.excerpt || undefined;
    const url = `${seoConfig.siteUrl}/${post.locale}/blog/${post.slug}`;
    const image = absolutizeUrl(post.coverImage ?? "/logo.png") ?? `${seoConfig.siteUrl}/logo.png`;
    return {
        title, description,
        openGraph: {
            title, description, url, siteName: seoConfig.siteName, locale: post.locale.replace("-", "_"), type: "article",
            publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString(),
            tags: post.tags?.split(","), images: [{ url: image, width: 1200, height: 630, alt: post.coverAlt ?? title }]
        },
        twitter: { card: "summary_large_image", title, description, images: [image] },
        alternates: { canonical: url },
        robots: { index: true, follow: true },
    };
}

export default async function PostPage({ params }: Props) {
    const { locale, slug } = await params;
    const post = await load(slug);
    if (!post) notFound();
    const author = [post.author?.firstName, post.author?.lastName].filter(Boolean).join(" ");

    const jsonLd = {
        "@context": "https://schema.org", "@type": "BlogPosting",
        headline: post.title, description: post.seoDescription || post.excerpt,
        image: post.coverImage, datePublished: post.publishedAt, dateModified: post.updatedAt,
        author: author ? { "@type": "Person", name: author } : undefined,
        mainEntityOfPage: `${SITE}/${locale}/blog/${post.slug}`,
    };

    return (
        <article className="container mx-auto max-w-3xl px-4 py-16">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
            <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={post.author?.profilePicture ?? undefined} />
                    <AvatarFallback>{author.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <span>{author}</span>
                <time dateTime={post.publishedAt?.toISOString()}>{post.publishedAt?.toLocaleDateString(locale)}</time>
                <span>· {post.readingMinutes} min</span>
            </div>
            {post.coverImage && (
                <div className="relative my-8 aspect-video overflow-hidden rounded-md">
                    <Image src={post.coverImage} alt={post.coverAlt ?? post.title} fill priority sizes="768px" className="object-cover" />
                </div>
            )}
            <MdxContent source={post.content} />
            <Separator className="my-10" />
            <div className="flex flex-wrap gap-2">
                {post.tags?.split(",").map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
        </article>
    );
}