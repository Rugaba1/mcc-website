import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const numId = Number(userId);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const { firstName, lastName, email, phoneNumber } = body;

    // Validate email if provided
    if (email !== undefined) {
      if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return NextResponse.json(
          { error: "A valid email is required" },
          { status: 400 },
        );
      // Check email not taken by another user
      const conflict = await prisma.user.findFirst({
        where: { email: email.trim().toLowerCase(), NOT: { id: numId } },
      });
      if (conflict)
        return NextResponse.json(
          { error: "Email already in use by another user" },
          { status: 409 },
        );
    }

    const data: Record<string, unknown> = {};

    if (email !== undefined) data.email = email.trim().toLowerCase();
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
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
}

export async function DELETE(req: NextRequest) {
  try {
    const res = NextResponse.json({ success: true });
    res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
    res.cookies.set("refresh_token", "", { path: "/api/auth", maxAge: 0 });
    return res;
  } catch (error) {
    console.error("DELETE /api/auth/me:", error);
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
