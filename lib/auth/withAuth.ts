import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string | null;
};

type RouteContext = { params: Promise<Record<string, string>> };

type Handler = (
  request: NextRequest,
  ctx: { user: AuthUser } & Partial<RouteContext>,
) => Promise<NextResponse>;

const unauthorized = (message = "Unauthorized") =>
  NextResponse.json({ error: message }, { status: 401 });

/** Same lookup as /api/auth/me: "Authorization: Bearer <token>", else the auth_token cookie. */
function getToken(request: NextRequest): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim() || undefined;
  }
  return request.cookies.get("auth_token")?.value;
}

/**
 * Checks the access token only (no permission checks yet).
 * Uses the project's own verifyToken, so it accepts exactly the tokens /api/auth/me accepts.
 */
export function withAuth(handler: Handler) {
  return async (request: NextRequest, routeCtx?: RouteContext) => {
    const token = getToken(request);
    if (!token) return unauthorized("Missing token");

    let userId: number;
    try {
      const verified = await verifyToken(token);
      userId = Number(verified);
    } catch {
      return unauthorized("Invalid or expired token");
    }
    if (!Number.isInteger(userId) || userId <= 0) {
      return unauthorized("Invalid or expired token");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive)
      return unauthorized("Account not found or disabled");

    // Errors thrown by the handler itself are not auth errors, so let them reach the route's own try/catch.
    return handler(request, { user, ...routeCtx });
  };
}
