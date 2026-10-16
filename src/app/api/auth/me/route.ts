import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

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
