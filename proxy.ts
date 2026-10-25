import type { NextRequest } from "next/server";
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

const { ws } = resolveApiOrigins();
const SIGNALING_ORIGIN = resolveSignalingOrigin(ws);

const join = (...parts: (string | false | null | undefined)[]) =>
  [...new Set(parts.filter((p): p is string => Boolean(p)))].join(" ");

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src ${join("'self'", `'nonce-${nonce}'`, !IS_PROD && "'unsafe-eval'", ...SCRIPT_HOSTS)}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${join("'self'", "data:", "blob:", API_ORIGIN, ...IMG_HOSTS)}`,
    `media-src ${join("'self'", "blob:", API_ORIGIN, GCS, CDN)}`,
    "font-src 'self' data:",
    `connect-src ${join("'self'", API_ORIGIN, WS_ORIGIN, SIGNALING_ORIGIN, ...CONNECT_HOSTS)}`,
    `frame-src ${join(...FRAME_HOSTS)}`,
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
  const response = intlMiddleware(request);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
