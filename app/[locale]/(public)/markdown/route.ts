import { NodeHtmlMarkdown } from "node-html-markdown";
import { countTokens } from "gpt-tokenizer";
import { routing } from "@/app/i18n/routing";
import { siteConfig } from "@/config/site.config";
import { isPublicMarkdownPage } from "@/lib/markdown-negotiation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const originalPath = request.headers.get("x-markdown-original-path");
  if (
    !originalPath ||
    !originalPath.startsWith("/") ||
    originalPath.startsWith("//")
  ) {
    return new Response("Not found", { status: 404 });
  }

  const siteOrigin = new URL(siteConfig.siteUrl);
  const pageUrl = new URL(originalPath, siteOrigin);
  if (
    pageUrl.origin !== siteOrigin.origin ||
    !isPublicMarkdownPage(pageUrl.pathname, routing.locales)
  ) {
    return new Response("Not found", { status: 404 });
  }

  const upstreamHeaders = new Headers({ Accept: "text/html" });
  for (const header of ["accept-language", "cookie", "user-agent"]) {
    const value = request.headers.get(header);
    if (value) upstreamHeaders.set(header, value);
  }

  let pageResponse: Response;
  try {
    pageResponse = await fetch(pageUrl, {
      headers: upstreamHeaders,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    console.error(`Markdown negotiation upstream request failed for ${pageUrl.pathname}:`, error);
    return new Response("Markdown conversion is temporarily unavailable", {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        Vary: "Accept, Accept-Language, Cookie",
      },
    });
  }
  if (pageResponse.status >= 300 && pageResponse.status < 400) {
    const location = pageResponse.headers.get("location");
    if (location) {
      return new Response(null, {
        status: pageResponse.status,
        headers: {
          Location: location,
          "Cache-Control": "private, no-store",
          Vary: "Accept, Accept-Language, Cookie",
        },
      });
    }
  }

  const contentType = pageResponse.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("text/html")) {
    return new Response(pageResponse.body, {
      status: pageResponse.status,
      statusText: pageResponse.statusText,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Cache-Control": "private, no-store",
        Vary: "Accept, Accept-Language, Cookie",
      },
    });
  }

  const markdown = NodeHtmlMarkdown.translate(await pageResponse.text());
  return new Response(markdown, {
    status: pageResponse.status,
    statusText: pageResponse.statusText,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": String(
        countTokens(markdown, { allowedSpecial: "all" }),
      ),
      "Cache-Control": "private, no-store",
      Vary: "Accept, Accept-Language, Cookie",
    },
  });
}
