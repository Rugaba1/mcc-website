import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/users — list all users (password excluded)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, active: true,
        canProducts: true, canCollections: true, canProjects: true,
        canTestimonials: true, canUsers: true, createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error("GET /api/users:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users — create user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role, active,
            canProducts, canCollections, canProjects, canTestimonials, canUsers } = body;

    // Required field validation
    if (!name?.trim())
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    if (!password || password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name:            name.trim(),
        email:           email.trim().toLowerCase(),
        password:        hashed,
        role:            role            ?? "staff",
        active:          active          ?? true,
        canProducts:     canProducts     ?? true,
        canCollections:  canCollections  ?? true,
        canProjects:     canProjects     ?? true,
        canTestimonials: canTestimonials ?? true,
        canUsers:        canUsers        ?? false,
      },
      select: {
        id: true, name: true, email: true, role: true, active: true,
        canProducts: true, canCollections: true, canProjects: true,
        canTestimonials: true, canUsers: true, createdAt: true,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("POST /api/users:", err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
