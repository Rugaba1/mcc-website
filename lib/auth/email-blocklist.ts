import "server-only";

import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth/email-hygiene";

export async function isEmailBlocklisted(email: string) {
  const entry = await prisma.emailBlocklist.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, isActive: true },
  });
  return entry?.isActive ?? false;
}
