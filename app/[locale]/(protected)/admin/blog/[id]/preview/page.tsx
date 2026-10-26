import { MediaImage } from "@/components/media-image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MdxContent } from "@/components/blog/mdx-content";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
    const post = await prisma.blogPost.findUnique({ where: { id: Number((await params).id) } });
    if (!post) notFound();
    return (
        <article className="container mx-auto max-w-3xl px-4 py-16">
            <Badge className="mb-4 rounded-none">Preview · {post.status.toLowerCase()}</Badge>
            <h1 className="text-4xl">{post.title}</h1>
            {post.coverImage && (                <MediaImage src={post.coverImage} alt={post.coverAlt ?? post.title} className="my-8 aspect-video w-full border object-cover" />
            )}
            <MdxContent source={post.content} />
        </article>
    );
}