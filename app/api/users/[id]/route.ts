import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { expandPermissions } from "@/lib/permissions/core";
import {
  USER_INCLUDE,
  formatRegularUser,
  formatUser,
  splitName,
} from "@/lib/users/format";
import { syncPermissions } from "@/lib/permissions/permissions";
import { validatePermissionAssignment } from "@/lib/permissions/assignment";
import { isEmailBlocklisted } from "@/lib/auth/email-blocklist";
import { normalizeEmail } from "@/lib/auth/email-hygiene";
import {
  AccountDeleteError,
  deleteUserAccount,
} from "@/lib/users/delete-account";
import { ROLE_IDS, STAFF_ROLES } from "@/lib/constants";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Ctx = { params: Promise<{ id: string }> };

export const PUT = withPermission([PERM.USERS_UPDATE, PERM.USERS_PERMISSIONS])(
  async (req: NextRequest, context) => {
  try {
    const id = Number((await context.params!).id);
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
    if (b.permissions !== undefined) {
      const permissionError = validatePermissionAssignment(
        b.permissions,
        context.user.permissions,
        { accountType: b.accountType },
      );
      if (permissionError)
        return NextResponse.json({ error: permissionError }, { status: 400 });
    }
    const hasCustomerRole = existing.role.some(
      (role) => role.id === ROLE_IDS.CUSTOMER,
    );
    const isStaffAccount =
      existing.role.some((role) =>
        STAFF_ROLES.includes(role.id as (typeof STAFF_ROLES)[number]),
      ) || (!hasCustomerRole && existing.permissions.length > 0);
    if ((b.accountType === "staff") !== isStaffAccount)
      return NextResponse.json(
        { error: "Account type does not match this page" },
        { status: 409 },
      );
    const isSelf = context.user.id === id;

    // don't let admins lock themselves out
    if (isSelf && b.active === false)
      return NextResponse.json(
        { error: "You can't disable your own account" },
        { status: 400 },
      );
    if (isSelf && Array.isArray(b.permissions)) {
      const effectivePermissions = expandPermissions(b.permissions);
      if (
        !effectivePermissions.has(PERM.ADMIN) &&
        (!effectivePermissions.has(PERM.USERS_UPDATE) ||
          !effectivePermissions.has(PERM.USERS_PERMISSIONS))
      ) {
        return NextResponse.json(
          { error: "You can't remove your own user-management access" },
          { status: 400 },
        );
      }
    }

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
      if (
        normalizeEmail(email) !== normalizeEmail(existing.email) &&
        (await isEmailBlocklisted(email))
      )
        return NextResponse.json(
          { error: "This email address is blocked." },
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
    if (
      b.active === true &&
      (await isEmailBlocklisted(
        (data.email as string | undefined) ?? existing.email,
      ))
    )
      return NextResponse.json(
        { error: "Remove the email block before reactivating this account." },
        { status: 409 },
      );
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
      if (Array.isArray(b.permissions))
        await syncPermissions(tx, id, b.permissions, context.user.id);
      if (b.active === false || b.password) {
        await tx.refreshToken.updateMany({
          where: { userId: id },
          data: { revokedAt: new Date(), replacedById: null },
        });
      }
      return tx.user.findUniqueOrThrow({
        where: { id },
        include: USER_INCLUDE,
      });
    });

    return NextResponse.json(
      b.accountType === "regular"
        ? formatRegularUser(updated)
        : formatUser(updated),
    );
  } catch (err) {
    console.error("PUT /api/users/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
  },
);

export const DELETE = withPermission(PERM.USERS_DEACTIVATE)(
  async (req: NextRequest, context) => {
  try {
    const id = Number((await context.params!).id);
    const type = req.nextUrl.searchParams.get("type") ?? "staff";
    if (type !== "staff" && type !== "regular")
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 },
      );
    if (context.user.id === id)
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
    const hasCustomerRole = existing.role.some(
      (role) => role.id === ROLE_IDS.CUSTOMER,
    );
    const isStaffAccount =
      existing.role.some((role) =>
        STAFF_ROLES.includes(role.id as (typeof STAFF_ROLES)[number]),
      ) || (!hasCustomerRole && existing.permissions.length > 0);
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
  },
);
