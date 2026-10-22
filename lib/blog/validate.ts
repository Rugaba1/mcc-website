import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

/** Returns an error message, or null when the MDX compiles. */
export async function checkMdx(source: string): Promise<string | null> {
  try {
    await compile(source, { remarkPlugins: [remarkGfm] });
    return null;
  } catch (e: any) {
    const line = e?.line ? ` (line ${e.line})` : "";
    return `Invalid MDX${line}: ${e?.reason ?? e?.message ?? "syntax error"}`;
  }
}