import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/middleware/withAuth";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { clearRefreshCookie, hasValidAuthRequestHeaders } from "@/lib/auth/csrf";
import { revokeRefreshSession } from "@/lib/auth/refresh-tokens";
import {
  checkEmailEligibility,
  normalizeEmail,
  PLUS_ALIASING_DOMAINS,
} from "@/lib/auth/email-hygiene";

export const PUT = withAuth(async (req: NextRequest, { user: authUser }) => {
  try {
    const numId = authUser.id;

    const body = await req.json();
    const { firstName, lastName, email, phoneNumber } = body;

    // Validate email if provided
    if (email !== undefined) {
      if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return NextResponse.json(
          { error: "A valid email is required" },
          { status: 400 },
        );
      const normalizedEmail = normalizeEmail(email);
      const domain = normalizedEmail.split("@").at(-1) ?? "";
      const account = await prisma.user.findUnique({
        where: { id: numId },
        select: { email: true },
      });
      if (!account)
        return NextResponse.json({ error: "User not found" }, { status: 404 });

      if (normalizedEmail !== account.email) {
        const eligibility = await checkEmailEligibility(normalizedEmail);
        if (eligibility === "lists_unavailable")
          return NextResponse.json(
            { error: "Email checks are temporarily unavailable. Please try again later." },
            { status: 503 },
          );
        if (eligibility === "disposable")
          return NextResponse.json(
            { error: "Temporary email addresses are not accepted." },
            { status: 400 },
          );
        if (eligibility === "no_mx")
          return NextResponse.json(
            { error: "This email domain cannot receive mail. Check the address and try again." },
            { status: 400 },
          );
      }

      // Check email not taken by another user
      const conflicts = await prisma.user.findMany({
        where: {
          NOT: { id: numId },
          OR: [
            { email: normalizedEmail },
            ...(PLUS_ALIASING_DOMAINS.has(domain)
              ? [{ email: { endsWith: `@${domain}` } }]
              : []),
          ],
        },
        select: { email: true },
      });
      if (conflicts.some((user) => normalizeEmail(user.email) === normalizedEmail))
        return NextResponse.json(
          { error: "Email already in use by another user" },
          { status: 409 },
        );
    }

    const data: Record<string, unknown> = {};

    if (email !== undefined) data.email = normalizeEmail(email);
    if (firstName !== undefined)
      data.firstName = firstName.trim().toLowerCase();
    if (lastName !== undefined) data.lastName = lastName.trim().toLowerCase();
    if (phoneNumber !== undefined)
      data.phoneNumber = phoneNumber.trim().toLowerCase();
    const user = await prisma.user.update({
      where: { id: numId },
      data,
      include: {
        permissions: {
          include: { permission: true },
        },
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const primaryRole = [...user.role].sort((a, b) => a.id - b.id)[0] ?? null;

    const permCodes = user.permissions.map((p) => p.permission.code);
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName ?? ""}`.trim(),
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      role: primaryRole
        ? { id: primaryRole.id, roleName: primaryRole.roleName }
        : { id: 8, roleName: "customer" },
      active: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (err: unknown) {
    console.error("PUT /api/users/[id]:", err);
    // Prisma P2025 = record not found
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
});

export const GET = withAuth(async (_req: NextRequest, { user: authUser }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const primaryRole = [...user.role].sort((a, b) => a.id - b.id)[0] ?? null;

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName ?? ""}`.trim(),
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
      role: primaryRole
        ? { id: primaryRole.id, roleName: primaryRole.roleName }
        : { id: 8, roleName: "customer" },
      active: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("GET /api/auth/me:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 },
    );
  }
});

export const DELETE = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 30,
})(async (req: NextRequest) => {
  if (!hasValidAuthRequestHeaders(req)) {
    return NextResponse.json({ error: "Invalid auth request" }, { status: 403 });
  }

  try {
    await revokeRefreshSession(req.cookies.get("refresh_token")?.value);
    const res = NextResponse.json({ success: true });
    clearRefreshCookie(res);
    return res;
  } catch (error) {
    console.error("DELETE /api/auth/me:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
});
