import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type OtpPurpose =
  | "login"
  | "password-reset"
  | "two-factor-enrollment";

export interface OtpChallenge {
  purpose: OtpPurpose;
  subject: string;
  expiresAt: number;
  nonce: string;
  binding: string;
}

function secret() {
  const value = process.env.OTP_SECRET;
  if (!value || value.length < 32) {
    throw new Error("OTP_SECRET must be set and at least 32 characters");
  }
  return value;
}

const hmac = (value: string) =>
  createHmac("sha256", secret()).update(value).digest();

function expectedCode(payload: OtpChallenge) {
  const digest = hmac(`code:${JSON.stringify(payload)}`);
  const value = digest.readUInt32BE(0) % 1_000_000;
  return value.toString().padStart(6, "0");
}

function createChallenge(
  details: Omit<OtpChallenge, "expiresAt" | "nonce">,
  ttlMs: number,
) {
  const payload: OtpChallenge = {
    ...details,
    expiresAt: Date.now() + ttlMs,
    nonce: randomBytes(16).toString("base64url"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = hmac(`challenge:${encoded}`).toString("base64url");
  return { payload, challenge: `${encoded}.${signature}` };
}

export function issueStatelessOtp(
  details: Omit<OtpChallenge, "expiresAt" | "nonce">,
  ttlMs: number,
) {
  const issued = createChallenge(details, ttlMs);
  return {
    challenge: issued.challenge,
    code: expectedCode(issued.payload),
  };
}

export function issueStatelessChallenge(
  details: Omit<OtpChallenge, "expiresAt" | "nonce">,
  ttlMs: number,
) {
  return createChallenge(details, ttlMs).challenge;
}

export function verifyStatelessOtp(
  challenge: string,
  code: string,
  purpose: OtpPurpose,
): OtpChallenge | null {
  const payload = verifyStatelessChallenge(challenge, purpose);
  if (!payload || !/^\d{6}$/.test(code)) return null;

  const actualCode = Buffer.from(code);
  const correctCode = Buffer.from(expectedCode(payload));
  return actualCode.length === correctCode.length &&
    timingSafeEqual(actualCode, correctCode)
    ? payload
    : null;
}

export function verifyStatelessChallenge(
  challenge: string,
  purpose: OtpPurpose,
): OtpChallenge | null {
  const [encoded, signature, extra] = challenge.split(".");
  if (!encoded || !signature || extra !== undefined) return null;

  let payload: OtpChallenge;
  try {
    const actualSignature = Buffer.from(signature, "base64url");
    const expectedSignature = hmac(`challenge:${encoded}`);
    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(actualSignature, expectedSignature)
    ) {
      return null;
    }
    payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as OtpChallenge;
  } catch {
    return null;
  }

  if (
    payload.purpose !== purpose ||
    typeof payload.subject !== "string" ||
    typeof payload.binding !== "string" ||
    typeof payload.nonce !== "string" ||
    !Number.isSafeInteger(payload.expiresAt) ||
    payload.expiresAt <= Date.now()
  ) {
    return null;
  }

  return payload;
}

export function otpBinding(value: string) {
  return hmac(`binding:${value}`).toString("hex");
}
