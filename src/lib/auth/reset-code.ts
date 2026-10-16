import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const RESET_MAX_ATTEMPTS = 5;

function secret(): string {
  const s = process.env.RESET_TOKEN_SECRET;
  if (!s) throw new Error("RESET_TOKEN_SECRET is not set");
  return s;
}

// Unbiased 6-digit code, e.g. "483920"
export function generateResetCode(): string {
  return randomInt(100000, 1000000).toString();
}

// Store this hash in the DB, never the code itself
export function hashResetCode(userId: string, code: string): string {
  return createHmac("sha256", secret())
    .update(`${userId}:${code}`)
    .digest("hex");
}

export function verifyResetCode(
  userId: string,
  code: string,
  storedHash: string,
): boolean {
  const a = Buffer.from(hashResetCode(userId, code));
  const b = Buffer.from(storedHash);
  return a.length === b.length && timingSafeEqual(a, b);
}
