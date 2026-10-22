import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasApiPermission } from "@/lib/auth/api-access";
import { USER_INCLUDE, formatUser, splitName } from "@/lib/users/format";
import { syncPermissions } from "@/lib/auth/permissions";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canManage = (u: Parameters<typeof hasApiPermission>[0]) =>
  hasApiPermission(u, "users.manage") || hasApiPermission(u, "admin");

export async function GET(req: NextRequest) {
  try {
    const me = await getApiUser(req);
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // if (!canManage(me))
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await prisma.user.findMany({
      include: USER_INCLUDE,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(users.map(formatUser));
  } catch (err) {
    console.error("GET /api/users:", err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await getApiUser(req);
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManage(me))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const b = await req.json();
    const name = String(b.name ?? "").trim();
    const email = String(b.email ?? "")
      .trim()
      .toLowerCase();
    const jobTitle = String(b.jobTitle ?? "").trim() || null;

    if (!name)
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!EMAIL.test(email))
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 },
      );
    if (!b.password || b.password.length < 6)
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    if (b.showOnHomepage && !jobTitle)
      return NextResponse.json(
        { error: "A job title is required to show on the homepage" },
        { status: 400 },
      );

    if (await prisma.user.findUnique({ where: { email } }))
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );

    const { firstName, lastName } = splitName(name);
    const hashed = await bcrypt.hash(b.password, 12);

    const created = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashed,
          isActive: b.active ?? true,
          profilePicture: b.profilePicture || null,
          jobTitle,
          bio:
            String(b.bio ?? "")
              .trim()
              .slice(0, 500) || null,
          showOnHomepage: !!b.showOnHomepage,
          displayOrder: Number.isFinite(b.displayOrder)
            ? Number(b.displayOrder)
            : 0,
        },
      });
      if (Array.isArray(b.permissions))
        await syncPermissions(tx, u.id, b.permissions, me.id);
      return tx.user.findUniqueOrThrow({
        where: { id: u.id },
        include: USER_INCLUDE,
      });
    });

    return NextResponse.json(formatUser(created), { status: 201 });
  } catch (err) {
    console.error("POST /api/users:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
