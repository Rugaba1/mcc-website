import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getApiUser, hasApiPermission } from "@/lib/auth/api-access";
import { USER_INCLUDE, formatUser, splitName } from "@/lib/users/format";
import { syncPermissions } from "@/lib/auth/permissions";
import {
  AccountDeleteError,
  deleteUserAccount,
} from "@/lib/users/delete-account";
import { ROLE_IDS, STAFF_ROLES } from "@/lib/constants";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Ctx = { params: Promise<{ id: string }> };

const canManage = (u: Parameters<typeof hasApiPermission>[0]) =>
  hasApiPermission(u, "users.manage") || hasApiPermission(u, "admin");

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const me = await getApiUser(req);
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // if (!canManage(me))
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = Number((await params).id);
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true, permissions: { include: { permission: true } } },
    });
    if (!existing)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const b = await req.json();
    if (b.accountType !== "staff" && b.accountType !== "regular")
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 },
      );
    const isStaffAccount =
      existing.role.some((role) =>
        STAFF_ROLES.includes(role.id as (typeof STAFF_ROLES)[number]),
      ) || existing.permissions.length > 0;
    if ((b.accountType === "staff") !== isStaffAccount)
      return NextResponse.json(
        { error: "Account type does not match this page" },
        { status: 409 },
      );
    const isSelf = me.id === id;

    // don't let admins lock themselves out
    if (isSelf && b.active === false)
      return NextResponse.json(
        { error: "You can't disable your own account" },
        { status: 400 },
      );
    if (
      isSelf &&
      Array.isArray(b.permissions) &&
      !b.permissions.includes("admin") &&
      !b.permissions.includes("users.manage")
    )
      return NextResponse.json(
        { error: "You can't remove your own user-management access" },
        { status: 400 },
      );

    const data: Record<string, unknown> = {};

    if (b.name !== undefined) {
      const name = String(b.name).trim();
      if (!name)
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 },
        );
      Object.assign(data, splitName(name));
    }
    if (b.email !== undefined) {
      const email = String(b.email).trim().toLowerCase();
      if (!EMAIL.test(email))
        return NextResponse.json(
          { error: "A valid email is required" },
          { status: 400 },
        );
      if (
        email !== existing.email &&
        (await prisma.user.findUnique({ where: { email } }))
      )
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      data.email = email;
    }
    if (b.phoneNumber !== undefined) {
      const phoneNumber = String(b.phoneNumber ?? "").trim() || null;
      if (
        phoneNumber &&
        phoneNumber !== existing.phoneNumber &&
        (await prisma.user.findUnique({ where: { phoneNumber } }))
      )
        return NextResponse.json(
          { error: "Phone number already in use" },
          { status: 409 },
        );
      data.phoneNumber = phoneNumber;
    }
    if (b.password) {
      if (b.password.length < 6)
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 },
        );
      data.password = await bcrypt.hash(b.password, 12);
    }
    if (b.active !== undefined) data.isActive = !!b.active;
    if (b.email !== undefined && data.email !== existing.email)
      data.emailVerifiedAt = null;
    else if (b.emailVerified !== undefined)
      data.emailVerifiedAt = b.emailVerified
        ? (existing.emailVerifiedAt ?? new Date())
        : null;
    if (b.profilePicture !== undefined)
      data.profilePicture = b.profilePicture || null;
    if (b.jobTitle !== undefined)
      data.jobTitle = String(b.jobTitle).trim() || null;
    if (b.bio !== undefined)
      data.bio = String(b.bio).trim().slice(0, 500) || null;
    if (b.showOnHomepage !== undefined)
      data.showOnHomepage = !!b.showOnHomepage;
    if (b.displayOrder !== undefined && Number.isFinite(Number(b.displayOrder)))
      data.displayOrder = Number(b.displayOrder);

    const finalTitle =
      (data.jobTitle as string | null | undefined) ?? existing.jobTitle;
    const finalShow =
      (data.showOnHomepage as boolean | undefined) ?? existing.showOnHomepage;
    if (finalShow && !finalTitle)
      return NextResponse.json(
        { error: "A job title is required to show on the homepage" },
        { status: 400 },
      );

    const updated = await prisma.$transaction(async (tx) => {
      const roleId =
        b.accountType === "regular"
          ? ROLE_IDS.CUSTOMER
          : Array.isArray(b.permissions)
            ? b.permissions.includes("admin")
              ? ROLE_IDS.ADMIN
              : ROLE_IDS.SUPPORT_STAFF
            : undefined;
      if (Object.keys(data).length || roleId !== undefined)
        await tx.user.update({
          where: { id },
          data: {
            ...data,
            ...(roleId !== undefined && { role: { set: [{ id: roleId }] } }),
          },
        });
      if (b.accountType === "staff" && Array.isArray(b.permissions))
        await syncPermissions(tx, id, b.permissions, me.id);
      return tx.user.findUniqueOrThrow({
        where: { id },
        include: USER_INCLUDE,
      });
    });

    return NextResponse.json(formatUser(updated));
  } catch (err) {
    console.error("PUT /api/users/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const me = await getApiUser(req);
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManage(me))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = Number((await params).id);
    const type = req.nextUrl.searchParams.get("type") ?? "staff";
    if (type !== "staff" && type !== "regular")
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 },
      );
    if (me.id === id)
      return NextResponse.json(
        { error: "Use Settings → Delete account to remove your own account" },
        { status: 400 },
      );

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { role: true, permissions: true },
    });
    if (!existing)
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    const isStaffAccount =
      existing.role.some((role) =>
        STAFF_ROLES.includes(role.id as (typeof STAFF_ROLES)[number]),
      ) || existing.permissions.length > 0;
    if ((type === "staff") !== isStaffAccount)
      return NextResponse.json(
        { error: "Account type does not match this page" },
        { status: 409 },
      );

    await deleteUserAccount(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AccountDeleteError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("DELETE /api/users/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
