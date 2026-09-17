import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseToken(token: string): { userId: number; exp: number } | null {
  try {
    return JSON.parse(Buffer.from(token, "base64url").toString());
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("mcc_session")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const payload = parseToken(token);
  if (!payload || payload.exp < Date.now())
    return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true, name: true, email: true, role: true, active: true,
      canProducts: true, canCollections: true, canProjects: true,
      canTestimonials: true, canUsers: true,
    },
  });
  if (!user || !user.active)
    return NextResponse.json({ error: "User not found or inactive" }, { status: 401 });

  return NextResponse.json(user);
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("mcc_session", "", { maxAge: 0, path: "/" });
  return res;
}
