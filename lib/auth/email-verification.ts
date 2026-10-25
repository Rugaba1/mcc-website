import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

interface VerificationPayload {
  userId: number;
  email: string;
  expiresAt: number;
}

function secret() {
  const value = process.env.OTP_SECRET;
  if (!value || value.length < 32) {
    throw new Error("OTP_SECRET must be set and at least 32 characters");
  }
  return value;
}

function signature(encoded: string) {
  return createHmac("sha256", secret())
    .update(`email-verification:${encoded}`)
    .digest();
}

export function createEmailVerificationToken(userId: number, email: string) {
  const payload: VerificationPayload = {
    userId,
    email,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded).toString("base64url")}`;
}

export function verifyEmailVerificationToken(token: string) {
  const [encoded, supplied, extra] = token.split(".");
  if (!encoded || !supplied || extra !== undefined) return null;

  try {
    const actual = Buffer.from(supplied, "base64url");
    const expected = signature(encoded);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as VerificationPayload;
    if (
      !Number.isSafeInteger(payload.userId) ||
      payload.userId <= 0 ||
      typeof payload.email !== "string" ||
      !Number.isSafeInteger(payload.expiresAt) ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
