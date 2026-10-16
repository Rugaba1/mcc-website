import { NextResponse, NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/app/i18n/routing";
import { verifyAccessPayload } from "@/lib/auth/jwt";
import { isGdprCountry } from "@/lib/gdpr-regions";
import {
  adminRoutes,
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
  loginPath,
  protectedRoutes,
  STAFF_ROLES,
  SCRIPT_HOSTS,
  WS_ORIGIN,
} from "@/lib/constants";

const intlMiddleware = createMiddleware(routing);

const join = (...parts: (string | false | null | undefined)[]) =>
  [...new Set(parts.filter((p): p is string => Boolean(p)))].join(" ");

function stripLocale(pathname: string) {
  return pathname.replace(EXPLICIT_LOCALE_PREFIX, "/") || "/";
}

function matchesPrefix(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

function redirectLocale(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (EXPLICIT_LOCALE_PREFIX.test(pathname)) return null;

  const locale = request.cookies.get("NEXT_LOCALE")?.value || defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set("NEXT_LOCALE", locale, {
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

  const { pathname, search } = request.nextUrl;
  const locale = pathname.split("/")[1] || defaultLocale;
  const path = stripLocale(pathname);
  const isAdminRoute = matchesPrefix(path, adminRoutes);
  const isAdminLogin = path === "/admin/login";

  // --- Auth (pages only; /api is excluded by the matcher and checks auth itself)
  const needsAuth =
    !isAdminLogin && (matchesPrefix(path, protectedRoutes) || isAdminRoute);

  let userId: number | null = null;
  if (needsAuth) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : request.cookies.get("auth_token")?.value;

    const claims = token ? await verifyAccessPayload(token) : null;
    userId = claims?.userId ?? null;
    if (isAdminRoute && (!claims?.role || !STAFF_ROLES.includes(claims.role as (typeof STAFF_ROLES)[number]))) {
      userId = null;
    }

    if (!userId) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminRoute ? `/${locale}/admin/login` : `/${locale}${loginPath}`;
      url.search = isAdminRoute ? "" : `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  // --- Request headers (these are what server components actually see)
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id"); // never trust a client-supplied value
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  if (userId) requestHeaders.set("x-user-id", String(userId));

  const response = intlMiddleware(
    new NextRequest(request, { headers: requestHeaders }),
  );

  // --- Response headers
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // --- GDPR / visitor country (Cloudflare header)
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

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
