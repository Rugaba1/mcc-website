import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { WEEK } from "@/lib/constants";

type Tx = Prisma.TransactionClient;

const REFRESH_GRACE_MS = 10_000;

const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

function clientMetadata(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return {
    userAgent: request.headers.get("user-agent")?.slice(0, 255) ?? null,
    ip: (forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip"))
      ?.slice(0, 45) ?? null,
  };
}

async function createTokenRow(
  tx: Tx,
  userId: number,
  familyId: string,
  request: NextRequest,
) {
  const token = randomBytes(32).toString("base64url");
  const row = await tx.refreshToken.create({
    data: {
      userId,
      familyId,
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + WEEK * 1000),
      ...clientMetadata(request),
    },
  });
  return { token, row };
}

export async function createRefreshSession(
  userId: number,
  request: NextRequest,
): Promise<{ token: string; sessionId: number }> {
  return prisma.$transaction(async (tx) => {
    const { token, row } = await createTokenRow(
      tx,
      userId,
      randomUUID(),
      request,
    );
    return { token, sessionId: row.id };
  });
}

export async function rotateRefreshSession(
  token: string,
  request: NextRequest,
) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const current = await tx.refreshToken.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: {
        user: {
          include: {
            role: true,
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!current) return { status: "invalid" as const };

    if (!current.user.isActive) {
      await tx.refreshToken.updateMany({
        where: { familyId: current.familyId, revokedAt: null },
        data: { revokedAt: now },
      });
      return { status: "invalid" as const };
    }

    if (current.revokedAt) {
      // replacedById distinguishes rotation grace from an administrative revoke.
      if (
        !current.replacedById ||
        now.getTime() - current.revokedAt.getTime() > REFRESH_GRACE_MS
      ) {
        await tx.refreshToken.updateMany({
          where: { familyId: current.familyId, revokedAt: null },
          data: { revokedAt: now },
        });
        return { status: "invalid" as const };
      }
    } else if (current.expiresAt <= now) {
      return { status: "invalid" as const };
    }

    if (!current.revokedAt) {
      const claimed = await tx.refreshToken.updateMany({
        where: { id: current.id, revokedAt: null },
        data: { revokedAt: now },
      });
      if (claimed.count !== 1) {
        const latest = await tx.refreshToken.findUnique({
          where: { id: current.id },
          select: { revokedAt: true, replacedById: true },
        });
        if (!latest?.revokedAt) return { status: "retry" as const };
        if (!latest.replacedById) return { status: "invalid" as const };
        if (now.getTime() - latest.revokedAt.getTime() > REFRESH_GRACE_MS) {
          await tx.refreshToken.updateMany({
            where: { familyId: current.familyId, revokedAt: null },
            data: { revokedAt: now },
          });
          return { status: "invalid" as const };
        }
      }
    }

    const { token: nextToken, row: nextRow } = await createTokenRow(
      tx,
      current.userId,
      current.familyId,
      request,
    );
    if (!current.revokedAt) {
      await tx.refreshToken.update({
        where: { id: current.id },
        data: { replacedById: nextRow.id },
      });
    }

    return {
      status: "rotated" as const,
      token: nextToken,
      sessionId: nextRow.id,
      user: current.user,
    };
  }, { isolationLevel: "ReadCommitted" });
}

export async function revokeRefreshSession(token: string | undefined) {
  if (!token) return;

  const current = await prisma.refreshToken.findUnique({
    where: { tokenHash: tokenHash(token) },
    select: { familyId: true },
  });
  if (!current) return;

  await prisma.refreshToken.updateMany({
    where: { familyId: current.familyId },
    data: { revokedAt: new Date(), replacedById: null },
  });
}
