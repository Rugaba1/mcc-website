import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import {
  PERM,
  REGULAR_PERMISSION_CODES,
} from "@/lib/permissions/catalog";
import {
  USER_INCLUDE,
  formatRegularUser,
  formatUser,
  splitName,
} from "@/lib/users/format";
import { syncPermissions } from "@/lib/permissions/permissions";
import { validatePermissionAssignment } from "@/lib/permissions/assignment";
import { DEFAULT_STAFF_PERMISSIONS } from "@/lib/permissions/catalog";
import { isEmailBlocklisted } from "@/lib/auth/email-blocklist";
import { ROLE_IDS, STAFF_ROLES } from "@/lib/constants";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GET = withPermission(PERM.USERS_VIEW)(
  async (req: NextRequest) => {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? "staff";
    if (type !== "staff" && type !== "regular")
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });

    const users = await prisma.user.findMany({
      where:
        type === "staff"
          ? {
              OR: [
                { role: { some: { id: { in: STAFF_ROLES } } } },
                {
                  AND: [
                    { permissions: { some: {} } },
                    { role: { none: { id: ROLE_IDS.CUSTOMER } } },
                  ],
                },
              ],
            }
          : {
              role: { some: { id: ROLE_IDS.CUSTOMER } },
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
        permissions: user.permissions
          .map(({ permission }) => permission.code)
          .filter((code) => REGULAR_PERMISSION_CODES.includes(code)),
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
  },
);

export const POST = withPermission([PERM.USERS_CREATE, PERM.USERS_PERMISSIONS])(
  async (req: NextRequest, { user }) => {
  try {
    const b = await req.json();
    if (b.accountType !== "staff" && b.accountType !== "regular")
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 },
      );
    let assignedPermissions: string[] | undefined;
    if (b.accountType === "staff") {
      const requestedPermissions =
        b.permissions === undefined
          ? DEFAULT_STAFF_PERMISSIONS
          : b.permissions;
      if (
        !Array.isArray(requestedPermissions) ||
        !requestedPermissions.every((code) => typeof code === "string")
      ) {
        return NextResponse.json(
          { error: "Invalid permissions." },
          { status: 400 },
        );
      }
      const permissionError = validatePermissionAssignment(
        requestedPermissions,
        user.permissions,
        { accountType: "staff" },
      );
      if (permissionError)
        return NextResponse.json({ error: permissionError }, { status: 400 });
      assignedPermissions = requestedPermissions;
    } else if (b.permissions !== undefined) {
      const permissionError = validatePermissionAssignment(
        b.permissions,
        user.permissions,
        { accountType: "regular" },
      );
      if (permissionError)
        return NextResponse.json({ error: permissionError }, { status: 400 });
      assignedPermissions = b.permissions;
    }
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
    if (await isEmailBlocklisted(email))
      return NextResponse.json(
        { error: "This email address is blocked." },
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
        : assignedPermissions?.includes("admin")
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
      if (assignedPermissions)
        await syncPermissions(tx, u.id, assignedPermissions, user.id);
      return tx.user.findUniqueOrThrow({
        where: { id: u.id },
        include: USER_INCLUDE,
      });
    });

    return NextResponse.json(
      b.accountType === "regular"
        ? formatRegularUser(created)
        : formatUser(created),
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/users:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
  },
);
