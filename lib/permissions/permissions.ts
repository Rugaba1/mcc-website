import { prisma } from "@/lib/prisma";
import {
  ALL_PERMISSION_CODES,
  PERMISSION_LABELS,
  REGULAR_PERMISSION_CODES,
  REGULAR_PERMISSION_LABELS,
} from "./catalog";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Makes the user's permissions exactly equal to `codes`, and logs every change. */
export async function syncPermissions(
  tx: Tx,
  userId: number,
  codes: string[],
  actorId: number | null,
) {
  const allowedCodes = [...ALL_PERMISSION_CODES, ...REGULAR_PERMISSION_CODES];
  const labels = { ...PERMISSION_LABELS, ...REGULAR_PERMISSION_LABELS };
  const wanted = new Set(codes.filter((code) => allowedCodes.includes(code)));

  const current = await tx.userPermission.findMany({
    where: { userId },
    include: { permission: true },
  });
  const have = new Set(current.map((c) => c.permission.code));

  const toAdd = [...wanted].filter((c) => !have.has(c));
  const toRemove = [...have].filter((c) => !wanted.has(c));

  for (const code of toAdd) {
    const perm = await tx.permission.upsert({
      where: { code },
      update: {},
      create: { code, description: labels[code] ?? null },
    });
    await tx.userPermission.create({
      data: { userId, permissionId: perm.id, grantedById: actorId },
    });
    await tx.permissionLog.create({
      data: {
        targetUserId: userId,
        actorUserId: actorId,
        permissionCode: code,
        action: "GRANTED",
      },
    });
  }

  if (toRemove.length) {
    await tx.userPermission.deleteMany({
      where: { userId, permission: { code: { in: toRemove } } },
    });
    await tx.permissionLog.createMany({
      data: toRemove.map((code) => ({
        targetUserId: userId,
        actorUserId: actorId,
        permissionCode: code,
        action: "REVOKED",
      })),
    });
  }
}
