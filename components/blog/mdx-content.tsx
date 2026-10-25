import { MDXRemote } from "next-mdx-remote/rsc";
import {
    mdxComponents,
    mdxRehypePlugins,
    mdxRemarkPlugins,
} from "@/components/blog/mdx-renderers";

export function MdxContent({ source }: { source: string }) {
    return (
        <MDXRemote
            source={source}
            components={mdxComponents}
            options={{
                mdxOptions: {
                    remarkPlugins: mdxRemarkPlugins,
                    rehypePlugins: mdxRehypePlugins,
                },
            }}
        />
    );
}