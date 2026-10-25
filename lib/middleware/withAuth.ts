import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessPayload } from "@/lib/auth/jwt";
import { permissionsForAccount } from "@/lib/permissions/core";
import { getPendingLegalDocuments } from "@/lib/legal/documents";
import { defaultLocale, ROLE_IDS } from "@/lib/constants";
import { siteConfig } from "@/config/site.config";
import { withRateLimit, type MiddlewareContext } from "./withRateLimit";

type RateLimitOptions = { interval?: number; uniqueTokenPerInterval?: number };

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string | null;
  permissions: string[];
};

type RouteContext = { params: Promise<any> };
type RequestContext = RouteContext & MiddlewareContext;

export type AuthenticatedHandler = (
  request: NextRequest,
  ctx: { user: AuthUser } & RequestContext,
) => Promise<NextResponse>;

export type OptionalAuthHandler = (
  request: NextRequest,
  ctx: { user: AuthUser | null } & RequestContext,
) => Promise<NextResponse>;

const unauthorized = (message = "Unauthorized") =>
  NextResponse.json({ error: message }, { status: 401 });

function skipsLegalAcceptance(pathname: string) {
  return (
    pathname === "/api/legal/acceptance" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/admin/legal" ||
    pathname.startsWith("/api/admin/legal/")
  );
}

async function requireLegalAcceptance(request: NextRequest, userId: number) {
  if (skipsLegalAcceptance(request.nextUrl.pathname)) return null;
  const { pendingVersions } = await getPendingLegalDocuments(userId);
  if (!pendingVersions.length) return null;
  return NextResponse.json(
    {
      error: "Accept the latest legal documents to continue",
      code: "LEGAL_ACCEPTANCE_REQUIRED",
    },
    { status: 428 },
  );
}

function getToken(request: NextRequest): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim() || undefined;
  }
  return undefined;
}

 
async function resolveUser(request: NextRequest): Promise<AuthUser | null> {
  const token = getToken(request);
  if (!token) return null;

  let claims;
  try {
    claims = await verifyAccessPayload(token);
  } catch {
    return null;
  }
  if (!claims) return null;

  const [user, session] = await Promise.all([
    prisma.user.findFirst({
      where: { id: claims.userId, isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: { select: { id: true } },
        permissions: {
          select: { permission: { select: { code: true } } },
        },
      },
    }),
    prisma.refreshToken.findFirst({
      where: {
        id: claims.sessionId,
        userId: claims.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    }),
  ]);
  if (!user || !session) return null;

  const accountType = user.role.some((role) => role.id === ROLE_IDS.CUSTOMER)
    ? "regular"
    : "staff";
  const permissions = [
    ...permissionsForAccount(
      user.permissions.map(({ permission }) => permission.code),
      accountType,
    ),
  ];
  const permissionClaims = new Set(claims.permissions);
  if (
    permissionClaims.size !== permissions.length ||
    permissions.some((code) => !permissionClaims.has(code))
  ) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    permissions,
  };
}

export function withAuth(
  handler: AuthenticatedHandler,
  rateLimitOptions: RateLimitOptions = {},
) {
  return withRateLimit({
    interval: 60_000,
    uniqueTokenPerInterval: 500,
    ...rateLimitOptions,
  })(async (request: NextRequest, routeCtx?: RequestContext) => {
    const user = await resolveUser(request);
    if (!user) return unauthorized("Missing or invalid token");
    const acceptanceError = await requireLegalAcceptance(request, user.id);
    if (acceptanceError) return acceptanceError;
    return handler(request, {
      user,
      ...routeCtx,
      params: routeCtx?.params ?? Promise.resolve({}),
      locale: routeCtx?.locale ?? defaultLocale,
      timeZone: routeCtx?.timeZone ?? siteConfig.defaultTimeZone,
      clientIp: routeCtx?.clientIp ?? null,
      userAgent: routeCtx?.userAgent ?? null,
    });
  });
}

export function withOptionalAuth(
  handler: OptionalAuthHandler,
  rateLimitOptions: RateLimitOptions = {},
) {
  return withRateLimit({
    interval: 60_000,
    uniqueTokenPerInterval: 500,
    ...rateLimitOptions,
  })(async (request: NextRequest, routeCtx?: RequestContext) => {
    const user = await resolveUser(request);
    if (user) {
      const acceptanceError = await requireLegalAcceptance(request, user.id);
      if (acceptanceError) return acceptanceError;
    }
    return handler(request, {
      user,
      ...routeCtx,
      params: routeCtx?.params ?? Promise.resolve({}),
      locale: routeCtx?.locale ?? defaultLocale,
      timeZone: routeCtx?.timeZone ?? siteConfig.defaultTimeZone,
      clientIp: routeCtx?.clientIp ?? null,
      userAgent: routeCtx?.userAgent ?? null,
    });
  });
}
