import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./app/i18n/routing";
import createMiddleware from "next-intl/middleware";
import {
  API_ORIGIN,
  CDN,
  CONNECT_HOSTS,
  FRAME_HOSTS,
  GCS,
  IMG_HOSTS,
  IS_PROD,
  SCRIPT_HOSTS,
  WS_ORIGIN,
} from "./lib/constants";
import { siteConfig } from "@/config/site.config";
import { resolveTimeZone, TIME_ZONE_COOKIE_NAME } from "@/lib/timezone";
import {
  acceptsMarkdown,
  isPublicMarkdownPage,
} from "@/lib/markdown-negotiation";
const intlMiddleware = createMiddleware(routing);

function resolveApiOrigins(): { api?: string; ws?: string } {
  const base = siteConfig.publicApiBaseUrl ?? `${API_ORIGIN}/api`;
  try {
    const url = new URL(base);
    return {
      api: url.origin,
      ws: `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}`,
    };
  } catch {
    return { api: API_ORIGIN, ws: WS_ORIGIN };
  }
}

function resolveSignalingOrigin(wsOrigin?: string): string | null {
  const raw = siteConfig.websocketUrl;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const origin = `${url.protocol}//${url.host}`;
    return origin === wsOrigin ? null : origin;
  } catch {
    return null;
  }
}

const { api: API_CONNECT_ORIGIN, ws } = resolveApiOrigins();
const SIGNALING_ORIGIN = resolveSignalingOrigin(ws);

const join = (...parts: (string | false | null | undefined)[]) =>
  [...new Set(parts.filter((p): p is string => Boolean(p)))].join(" ");

function addVary(response: NextResponse, value: string): void {
  const vary = response.headers
    .get("Vary")
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
  if (!vary.some((item) => item.toLowerCase() === value.toLowerCase())) {
    vary.push(value);
  }
  response.headers.set("Vary", vary.join(", "));
}

function isLocalhost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]"
  );
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src ${join("'self'", `'nonce-${nonce}'`, !IS_PROD && "'unsafe-eval'", ...SCRIPT_HOSTS)}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${join("'self'", "data:", "blob:", API_ORIGIN, ...IMG_HOSTS)}`,
    `media-src ${join("'self'", "blob:", API_ORIGIN, GCS, CDN)}`,
    "font-src 'self' data:",
    `connect-src ${join("'self'", API_CONNECT_ORIGIN, API_ORIGIN, WS_ORIGIN, SIGNALING_ORIGIN, ...CONNECT_HOSTS)}`,
    `frame-src ${join("'self'", ...FRAME_HOSTS)}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    IS_PROD && "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function proxy(request: NextRequest) {
  if (IS_PROD && !isLocalhost(request.nextUrl.hostname)) {
    const forwardedProto = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const protocol = forwardedProto ?? request.nextUrl.protocol;
    const canonicalSiteUrl = new URL(siteConfig.siteUrl);

    if (
      (protocol !== "https" && protocol !== "https:") ||
      request.nextUrl.hostname !== canonicalSiteUrl.hostname
    ) {
      const canonicalUrl = new URL(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
        canonicalSiteUrl,
      );
      return NextResponse.redirect(canonicalUrl, 308);
    }
  }

  if (
    request.method === "GET" &&
    acceptsMarkdown(request.headers.get("accept")) &&
    isPublicMarkdownPage(request.nextUrl.pathname, routing.locales)
  ) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "x-markdown-original-path",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    const response = NextResponse.rewrite(
      new URL(`/${routing.defaultLocale}/markdown`, request.url),
      { request: { headers: requestHeaders } },
    );
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", csp);
  const firstSegment = request.nextUrl.pathname.split("/")[1];
  const locale =
    routing.locales.find((supportedLocale) => supportedLocale === firstSegment) ??
    routing.defaultLocale;
  request.headers.set("x-locale", locale);
  request.headers.set(
    "x-timezone",
    resolveTimeZone(request.cookies.get(TIME_ZONE_COOKIE_NAME)?.value),
  );
  const isDefaultLocalePath = firstSegment === routing.defaultLocale;
  // Avoid re-running locale-prefix canonicalization on the rewrite target for the default locale.
  const response = isDefaultLocalePath
    ? NextResponse.next({ request: { headers: request.headers } })
    : intlMiddleware(request);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  addVary(response, "Accept");
  const origin = siteConfig.siteUrl.replace(/\/$/, "");
  response.headers.append(
    "Link",
    `<${origin}/.well-known/ai-catalog.json>; rel="ai-catalog", <${origin}/.well-known/api-catalog>; rel="api-catalog"`,
  );
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
