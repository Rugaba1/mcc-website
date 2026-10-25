import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { z } from "zod";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { normalizeEmail } from "@/lib/auth/email-hygiene";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  email: z.string().trim().email().max(254).optional(),
  userId: z.number().int().positive().optional(),
  reason: z.string().trim().max(500).optional(),
}).strict().refine((data) => Boolean(data.email || data.userId), {
  message: "Choose a user or enter an email address.",
});

export const GET = withPermission(PERM.USERS_PERMISSIONS)(
  async () => {
    try {
      const entries = await prisma.emailBlocklist.findMany({
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          email: true,
          reason: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          revokedAt: true,
        },
      });
      return NextResponse.json(entries);
    } catch (error) {
      console.error("GET /api/admin/blocked-emails:", error);
      return NextResponse.json(
        { error: "Failed to load blocked email addresses." },
        { status: 500 },
      );
    }
  },
);

export const POST = withPermission(PERM.USERS_PERMISSIONS)(
  async (request: NextRequest, { user }) => {
    try {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
      }

      const parsed = createSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json({ error: "Enter a valid email address and reason." }, { status: 400 });

      const reason = parsed.data.reason || null;
      const result = await prisma.$transaction(async (tx) => {
        const targetUser = parsed.data.userId
          ? await tx.user.findUnique({
              where: { id: parsed.data.userId },
              select: { id: true, email: true },
            })
          : null;
        if (parsed.data.userId && !targetUser) {
          return { missingUser: true as const };
        }
        const email = normalizeEmail(targetUser?.email ?? parsed.data.email ?? "");
        if (
          targetUser &&
          parsed.data.email &&
          normalizeEmail(parsed.data.email) !== email
        ) {
          return { emailMismatch: true as const };
        }
        const existing = await tx.emailBlocklist.findUnique({ where: { email } });
        if (existing?.isActive) return { alreadyBlocked: true };

        const domain = email.slice(email.lastIndexOf("@") + 1);
        const possibleMatches = await tx.user.findMany({
          where: { email: { endsWith: `@${domain}` } },
          select: { id: true, email: true, isActive: true },
        });
        const matchingAccounts = possibleMatches.filter(
          (account) => normalizeEmail(account.email) === email,
        );
        const userIds = matchingAccounts.map((account) => account.id);
        const disabledAccounts = matchingAccounts.filter(
          (account) => account.isActive,
        ).length;

        if (userIds.length) {
          const adminPermissions = ["admin", "users.manage"];
          const [targetAdmins, activeAdmins] = await Promise.all([
            tx.user.count({
              where: {
                id: { in: userIds },
                isActive: true,
                permissions: {
                  some: { permission: { code: { in: adminPermissions } } },
                },
              },
            }),
            tx.user.count({
              where: {
                isActive: true,
                permissions: {
                  some: { permission: { code: { in: adminPermissions } } },
                },
              },
            }),
          ]);
          if (targetAdmins > 0 && targetAdmins >= activeAdmins) {
            return { lastAdmin: true as const };
          }
        }

        const entry = existing
          ? await tx.emailBlocklist.update({
              where: { id: existing.id },
              data: {
                reason,
                isActive: true,
                createdById: user.id,
                revokedAt: null,
                revokedById: null,
              },
            })
          : await tx.emailBlocklist.create({
              data: { email, reason, createdById: user.id },
            });

        if (userIds.length) {
          await tx.user.updateMany({
            where: { id: { in: userIds } },
            data: { isActive: false },
          });
          await tx.refreshToken.updateMany({
            where: { userId: { in: userIds }, revokedAt: null },
            data: { revokedAt: new Date(), replacedById: null },
          });
        }

        await tx.emailBlocklistEvent.create({
          data: { email, action: "BLOCKED", reason, actorUserId: user.id },
        });

        return { entry, disabledAccounts };
      });

      if ("alreadyBlocked" in result)
        return NextResponse.json(
          { error: "This email address is already blocked." },
          { status: 409 },
        );
      if ("missingUser" in result)
        return NextResponse.json({ error: "Selected user no longer exists." }, { status: 404 });
      if ("emailMismatch" in result)
        return NextResponse.json({ error: "Selected user does not match that email address." }, { status: 400 });
      if ("lastAdmin" in result)
        return NextResponse.json(
          { error: "This email matches the last active administrator and cannot be blocked." },
          { status: 409 },
        );

      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "This email address is already blocked." },
          { status: 409 },
        );
      }
      console.error("POST /api/admin/blocked-emails:", error);
      return NextResponse.json(
        { error: "Failed to block this email address." },
        { status: 500 },
      );
    }
  },
);
