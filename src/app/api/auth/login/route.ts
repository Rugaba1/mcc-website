import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function makeToken(userId: number) {
  const payload = { userId, exp: Date.now() + 8 * 60 * 60 * 1000 }; // 8 h
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export async function POST(req: NextRequest) {
  try {
    let email: string, password: string;
    try {
      ({ email, password } = await req.json());
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!email || !password)
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true, name: true, email: true, role: true, active: true,
        password: true,
        canProducts: true, canCollections: true, canProjects: true,
        canTestimonials: true, canUsers: true,
      },
    });

    if (!user || !user.active)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = makeToken(user.id);

    const res = NextResponse.json({
      id: user.id, name: user.name, email: user.email,
      role: user.role,
      canProducts: user.canProducts, canCollections: user.canCollections,
      canProjects: user.canProjects, canTestimonials: user.canTestimonials,
      canUsers: user.canUsers,
    });
    res.cookies.set("mcc_session", token, {
      httpOnly: true, path: "/", sameSite: "lax",
      maxAge: 8 * 60 * 60,
    });
    return res;
  } catch (err) {
    console.error("POST /api/auth/login:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
