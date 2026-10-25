import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { expandPermissions, hasAnyPermission } from "@/lib/permissions/core";
import { PERM } from "@/lib/permissions/catalog";
import { prisma } from "@/lib/prisma";

const eventPermissions = [
  PERM.ORDERS_VIEW,
  PERM.MESSAGES_VIEW,
  PERM.REVIEWS_MODERATE,
  PERM.PAYMENTS_VIEW,
] as const;

function allowedPermissions(granted: string[]) {
  const effective = expandPermissions(granted);
  if (effective.has(PERM.ADMIN)) return [...eventPermissions];
  return eventPermissions.filter((permission) => effective.has(permission));
}

function canViewNotifications(granted: string[]) {
  return hasAnyPermission(granted, eventPermissions);
}

const readSchema = z.object({
  notificationIds: z.array(z.number().int().positive()).min(1).max(50),
});

export const PATCH = withAuth(async (request: NextRequest, { user }) => {
  if (!canViewNotifications(user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = readSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Select one or more notifications to mark as read." },
      { status: 400 },
    );
  }

  try {
    const permissions = allowedPermissions(user.permissions);
    const notifications = await prisma.adminNotification.findMany({
      where: {
        id: { in: parsed.data.notificationIds },
        requiredPermission: { in: permissions },
        reads: { none: { userId: user.id } },
      },
      select: { id: true },
    });
    if (notifications.length) {
      await prisma.adminNotificationRead.createMany({
        data: notifications.map(({ id }) => ({
          notificationId: id,
          userId: user.id,
        })),
        skipDuplicates: true,
      });
    }
    return NextResponse.json({ markedRead: notifications.length });
  } catch (error) {
    console.error("PATCH /api/admin/notifications failed:", error);
    return NextResponse.json(
      { error: "Could not update notification status." },
      { status: 500 },
    );
  }
});
