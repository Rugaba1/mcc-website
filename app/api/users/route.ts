import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasApiPermission } from "@/lib/auth/api-access";
import { USER_INCLUDE, formatUser, splitName } from "@/lib/users/format";
import { syncPermissions } from "@/lib/auth/permissions";
import { ROLE_IDS, STAFF_ROLES } from "@/lib/constants";

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

    const type = req.nextUrl.searchParams.get("type") ?? "staff";
    if (type !== "staff" && type !== "regular")
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });

    const users = await prisma.user.findMany({
      where:
        type === "staff"
          ? {
              OR: [
                { role: { some: { id: { in: STAFF_ROLES } } } },
                { permissions: { some: {} } },
              ],
            }
          : {
              AND: [
                { role: { none: { id: { in: STAFF_ROLES } } } },
                { permissions: { none: {} } },
              ],
            },
      include: USER_INCLUDE,
      orderBy: { createdAt: "asc" },
    });
    if (type === "staff") return NextResponse.json(users.map(formatUser));

    return NextResponse.json(
      users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName ?? ""}`.trim(),
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        active: user.isActive,
        emailVerifiedAt: user.emailVerifiedAt,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      })),
    );
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
    if (b.accountType !== "staff" && b.accountType !== "regular")
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 },
      );
    const name = String(b.name ?? "").trim();
    const email = String(b.email ?? "")
      .trim()
      .toLowerCase();
    const phoneNumber = String(b.phoneNumber ?? "").trim() || null;
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
    if (
      phoneNumber &&
      (await prisma.user.findUnique({ where: { phoneNumber } }))
    )
      return NextResponse.json(
        { error: "Phone number already in use" },
        { status: 409 },
      );

    const { firstName, lastName } = splitName(name);
    const hashed = await bcrypt.hash(b.password, 12);
    const roleId =
      b.accountType === "regular"
        ? ROLE_IDS.CUSTOMER
        : Array.isArray(b.permissions) && b.permissions.includes("admin")
          ? ROLE_IDS.ADMIN
          : ROLE_IDS.SUPPORT_STAFF;

    const created = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phoneNumber,
          password: hashed,
          isActive: b.active ?? true,
          emailVerifiedAt: b.emailVerified ? new Date() : null,
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
          role: { connect: [{ id: roleId }] },
        },
      });
      if (b.accountType === "staff" && Array.isArray(b.permissions))
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
