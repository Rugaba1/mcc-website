import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function getApiUser(req: NextRequest) {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice(7)
    : req.cookies.get("auth_token")?.value;
  if (!token) return null;

  const userId = await verifyToken(token);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: { permissions: { include: { permission: true } } },
  });
}

export function hasApiPermission(
  user: NonNullable<Awaited<ReturnType<typeof getApiUser>>>,
  ...codes: string[]
) {
  const granted = new Set(user.permissions.map((item) => item.permission.code));
  return codes.some((code) => granted.has("admin") || granted.has(code));
}
