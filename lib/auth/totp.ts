import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function encryptionKey() {
  const value = process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!value || !/^[\da-fA-F]{64}$/.test(value)) {
    throw new Error(
      "TWO_FACTOR_ENCRYPTION_KEY must be a 64-character hexadecimal key",
    );
  }
  return Buffer.from(value, "hex");
}

export function generateTotpSecret() {
  const bytes = randomBytes(20);
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(value: string) {
  let bits = 0;
  let accumulator = 0;
  const bytes: number[] = [];
  for (const char of value.replace(/=+$/g, "").toUpperCase()) {
    const index = BASE32.indexOf(char);
    if (index < 0) throw new Error("Invalid authenticator secret");
    accumulator = (accumulator << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
}

export function decryptTotpSecret(value: string) {
  const packed = Buffer.from(value, "base64url");
  if (packed.length < 29) throw new Error("Invalid encrypted authenticator secret");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    packed.subarray(0, 12),
  );
  decipher.setAuthTag(packed.subarray(12, 28));
  return Buffer.concat([
    decipher.update(packed.subarray(28)),
    decipher.final(),
  ]).toString("utf8");
}

function codeAt(secret: string, step: number) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac("sha1", decodeBase32(secret))
    .update(counter)
    .digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (binary % 1_000_000).toString().padStart(6, "0");
}

export function verifyTotp(secret: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const currentStep = Math.floor(Date.now() / 30_000);
  const supplied = Buffer.from(code);
  return [-1, 0, 1].some((offset) => {
    const expected = Buffer.from(codeAt(secret, currentStep + offset));
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
}

export function authenticatorUri(secret: string, email: string) {
  const label = encodeURIComponent(`Mountain Ceramic:${email}`);
  const issuer = encodeURIComponent("Mountain Ceramic");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
