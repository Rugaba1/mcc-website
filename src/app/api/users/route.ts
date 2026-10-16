import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/users — list all users (password excluded)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formatted = users.map((u) => {
      const permCodes = u.permissions.map((p) => p.permission.code);
      return {
        id: u.id,
        name: `${u.firstName} ${u.lastName || ""}`.trim(),
        email: u.email,
        role: permCodes.includes("admin") ? "admin" : "staff",
        active: u.isActive,
        canProducts: true,
        canCollections: true,
        canProjects: true,
        canTestimonials: true,
        canUsers: permCodes.includes("users.manage"),
        permissions: permCodes,
        createdAt: u.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET /api/users:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users — create user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, active } = body;

    // Required field validation
    if (!name?.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    if (!password || password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing)
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || name.trim();
    const lastName = parts.slice(1).join(" ") || null;

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        password: hashed,
        isActive: active ?? true,
      },
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
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/users:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
