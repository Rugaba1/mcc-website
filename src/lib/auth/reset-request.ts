import { prisma } from "@/lib/prisma";
import { RESET_MAX_ATTEMPTS, verifyResetCode } from "@/lib/auth/reset-code";

export async function checkResetCode(email: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;

  const record = await prisma.forgetPasswordRequest.findFirst({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;

  // Count the attempt first. The increment is atomic, so parallel guesses can't beat the limit.
  const { attempts } = await prisma.forgetPasswordRequest.update({
    where: { id: record.id },
    data: { attempts: { increment: 1 } },
    select: { attempts: true },
  });
  if (attempts > RESET_MAX_ATTEMPTS) return null;

  if (!verifyResetCode(String(user.id), code, record.codeHash)) return null;

  return { user, record };
}
