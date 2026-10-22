import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolink from "rehype-autolink-headings";
 
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/app/i18n/routing";

const link = "text-accent underline decoration-primary decoration-2 underline-offset-4 hover:bg-secondary dark:text-primary";

const components = {
    h2: (p: any) => <h2 className="mt-12 mb-4 scroll-mt-24 text-3xl" {...p} />,
    h3: (p: any) => <h3 className="mt-8 mb-3 scroll-mt-24 text-2xl" {...p} />,
    p: (p: any) => <p className="leading-8 [&:not(:first-child)]:mt-5" {...p} />,
    ul: (p: any) => <ul className="my-5 ml-6 list-disc space-y-2 marker:text-primary" {...p} />,
    ol: (p: any) => <ol className="my-5 ml-6 list-decimal space-y-2 marker:text-primary" {...p} />,
    blockquote: (p: any) => (
        <blockquote className="my-8 border-l-4 border-primary bg-secondary/60 py-3 pl-6 pr-4 text-lg text-secondary-foreground dark:text-foreground" {...p} />
    ),
    hr: () => <Separator className="my-10" />,
    a: ({ href = "", ...p }: any) =>
        href.startsWith("/") ? (
            <Link href={href} className={link} {...p} />
        ) : (
            <a href={href} target="_blank" rel="noopener noreferrer" className={link} {...p} />
        ),
    img: ({ src, alt }: any) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ""} loading="lazy" className="my-8 w-full border" />
    ),
    table: (p: any) => (
        <div className="my-8 overflow-x-auto border">
            <table className="w-full text-sm" {...p} />
        </div>
    ),
    th: (p: any) => <th className="border-b bg-secondary px-3 py-2 text-left font-bold text-secondary-foreground dark:text-foreground" {...p} />,
    td: (p: any) => <td className="border-b px-3 py-2" {...p} />,
    code: (p: any) => <code className="bg-muted px-1.5 py-0.5 font-mono text-[0.9em]" {...p} />,
    pre: (p: any) => <pre className="my-6 overflow-x-auto border bg-muted p-4 font-mono text-sm" {...p} />,

    // Components authors can write in MDX
    Callout: ({ children }: any) => (
        <Card className="my-8 rounded-none border-l-4 border-l-primary bg-secondary/60 shadow-none">
            <CardContent className="pt-6 [&>p]:mt-0">{children}</CardContent>
        </Card>
    ),
    Tag: ({ children }: any) => <Badge variant="secondary" className="rounded-none">{children}</Badge>,
};

export function MdxContent({ source }: { source: string }) {
    return (
        <MDXRemote
            source={source}
            components={components}
            options={{
                mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [rehypeSlug, [rehypeAutolink, { behavior: "wrap" }]],
                },
            }}
        />
    );
}