import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type Ctx = { params: Promise<{ id: string }> };

// PUT /api/users/:id — update user
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const { name, email, password, active } = body;

    // Validate email if provided
    if (email !== undefined) {
      if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
      // Check email not taken by another user
      const conflict = await prisma.user.findFirst({
        where: { email: email.trim().toLowerCase(), NOT: { id: numId } },
      });
      if (conflict)
        return NextResponse.json({ error: "Email already in use by another user" }, { status: 409 });
    }

    // Validate password if provided
    if (password && password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      const parts = name.trim().split(/\s+/);
      data.firstName = parts[0] || name.trim();
      data.lastName = parts.slice(1).join(" ") || null;
    }
    if (email !== undefined) data.email = email.trim().toLowerCase();
    if (active !== undefined) data.isActive = active;
    if (password) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: numId },
      data,
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    const permCodes = user.permissions.map((p) => p.permission.code);
    return NextResponse.json({
      id: user.id,
      name: `${user.firstName} ${user.lastName || ""}`.trim(),
      email: user.email,
      role: permCodes.includes("admin") ? "admin" : "staff",
      active: user.isActive,
      canProducts: true,
      canCollections: true,
      canProjects: true,
      canTestimonials: true,
      canUsers: permCodes.includes("users.manage"),
      permissions: permCodes,
      createdAt: user.createdAt,
    });
  } catch (err: unknown) {
    console.error("PUT /api/users/[id]:", err);
    // Prisma P2025 = record not found
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2025")
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users/:id
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await prisma.user.delete({ where: { id: numId } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/users/[id]:", err);
    if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2025")
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
