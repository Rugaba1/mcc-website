import { SignJWT, jwtVerify } from "jose";
import { siteConfig } from "@/config/site.config";

const ISSUER = siteConfig.jwtIssuer;
const encoder = new TextEncoder();

// Static process.env access is required for Edge, and keys are built lazily
// so a missing env var doesn't break `next build`.
const accessKey = () =>
  toKey(process.env.ACCESS_TOKEN_SECRET, "ACCESS_TOKEN_SECRET");
function toKey(secret: string | undefined, name: string): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error(`${name} must be set and at least 32 characters`);
  }
  return encoder.encode(secret);
}

export interface TokenPayload {
  userId: number;
  sessionId: number;
  permissions: string[];
}

export interface AccessClaims {
  userId: number;
  sessionId: number;
  permissions: string[];
}

// JWT `sub` is always a string, so parse it back to a number
function parseUserId(sub: string | undefined): number | null {
  if (!sub) return null;
  const id = Number(sub);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function sign(
  payload: TokenPayload,
  key: Uint8Array,
  audience: "access",
  expiresIn: string,
  extra: Record<string, unknown> = {},
): Promise<string> {
  return new SignJWT(extra)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export function generateAccessToken(payload: TokenPayload) {
  return sign(payload, accessKey(), "access", "15m", {
    sessionId: payload.sessionId,
    permissions: payload.permissions,
  });
}

async function verify(
  token: string,
  key: Uint8Array,
  audience: "access",
) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience,
    });
    return payload;
  } catch {
    return null;
  }
}

export async function verifyAccessPayload(
  token: string,
): Promise<AccessClaims | null> {
  const p = await verify(token, accessKey(), "access");
  const userId = parseUserId(p?.sub);
  const sessionId = Number(p?.sessionId);
  if (!p || userId === null) return null;
  if (!Number.isSafeInteger(sessionId) || sessionId <= 0) return null;
  if (
    !Array.isArray(p.permissions) ||
    !p.permissions.every((code) => typeof code === "string")
  ) {
    return null;
  }
  return {
    userId,
    sessionId,
    permissions: p.permissions,
  };
}

export async function verifyAccessToken(token: string): Promise<number | null> {
  return (await verifyAccessPayload(token))?.userId ?? null;
}

// Kept so older imports keep working
export const verifyToken = verifyAccessToken;
