import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth/jwt";
import { routing } from "./app/i18n/routing";
import createMiddleware from "next-intl/middleware";
import { isGdprCountry } from "@/lib/gdpr-regions";
import {
  API_ORIGIN,
  CDN,
  CONNECT_HOSTS,
  DAY,
  defaultLocale,
  EXPLICIT_LOCALE_PREFIX,
  FRAME_HOSTS,
  GCS,
  IMG_HOSTS,
  IS_PROD,
  publicRoutes,
  ROLE_IDS,
  SCRIPT_HOSTS,
  WS_ORIGIN,
} from "./lib/constants";
const intlMiddleware = createMiddleware(routing);

function redirectLocale(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  console.log(EXPLICIT_LOCALE_PREFIX.test(pathname));
  if (EXPLICIT_LOCALE_PREFIX.test(pathname)) return null;
  const url = request.nextUrl.clone();
  const locale = request.cookies.get("NEXT_LOCALE")?.value || defaultLocale;
  console.log(locale);
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set("NEXT_LOCALE", defaultLocale, {
    path: "/",
    maxAge: DAY * 365,
    sameSite: "lax",
  });
  return response;
}

function resolveApiOrigins(): { api?: string; ws?: string } {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? `${API_ORIGIN}/api`;
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
  const raw = process.env.NEXT_WS_ORIGIN;
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

export async function middleware(request: NextRequest) {
  const redirect = redirectLocale(request);

  if (redirect) return redirect;

  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  request.headers.set("x-nonce", nonce);
  const response = intlMiddleware(request);
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  const headerCountry = request.headers.get("cf-ipcountry");

  const requiresConsent =
    request.nextUrl.searchParams.get("gdpr") === "1" ||
    isGdprCountry(headerCountry);

  const cookieOptions = { path: "/", maxAge: DAY, sameSite: "lax" as const };
  response.cookies.set(
    "gdpr_region",
    requiresConsent ? "1" : "0",
    cookieOptions,
  );
  response.cookies.set("visitor_country", headerCountry ?? "", cookieOptions);

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check authentication
  const authHeader =
    request.headers.get("authorization") ||
    request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Authentication required",
      },
      { status: 401 },
    );
  }

  const userId = await verifyToken(token);
  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Invalid or expired token",
      },
      { status: 401 },
    );
  }

  response.headers.set("x-user-id", String(userId));

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
