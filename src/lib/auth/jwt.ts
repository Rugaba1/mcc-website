import { SignJWT, jwtVerify } from "jose";

const ISSUER = process.env.NEXT_PUBLIC_APP_NAME || "mountain-ceramics";
const encoder = new TextEncoder();

// Static process.env access is required for Edge, and keys are built lazily
// so a missing env var doesn't break `next build`.
const accessKey = () =>
  toKey(process.env.ACCESS_TOKEN_SECRET, "ACCESS_TOKEN_SECRET");
const refreshKey = () =>
  toKey(process.env.REFRESH_TOKEN_SECRET, "REFRESH_TOKEN_SECRET");

function toKey(secret: string | undefined, name: string): Uint8Array {
  if (!secret || secret.length < 32) {
    throw new Error(`${name} must be set and at least 32 characters`);
  }
  return encoder.encode(secret);
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: number;
}

export interface AccessClaims {
  userId: number;
  role?: number;
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
  audience: "access" | "refresh",
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
  // role is included so middleware can gate /admin without a DB call
  return sign(payload, accessKey(), "access", "15m", { role: payload.role });
}

export function generateRefreshToken(payload: TokenPayload) {
  return sign(payload, refreshKey(), "refresh", "7d");
}

async function verify(
  token: string,
  key: Uint8Array,
  audience: "access" | "refresh",
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
  if (!p || userId === null) return null;
  return {
    userId,
    role: typeof p.role === "number" ? p.role : undefined,
  };
}

export async function verifyAccessToken(token: string): Promise<number | null> {
  return (await verifyAccessPayload(token))?.userId ?? null;
}

export async function verifyRefreshToken(
  token: string,
): Promise<number | null> {
  const p = await verify(token, refreshKey(), "refresh");
  return parseUserId(p?.sub);
}

// Kept so older imports keep working
export const verifyToken = verifyAccessToken;
