import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { INVOICE_STORAGE_DIR } from "./config";

const KEY_RE = /^[a-f0-9]{32}\.pdf$/;

function resolveKey(fileKey: string) {
  // Only our own random keys are ever allowed, so path traversal is impossible.
  if (!KEY_RE.test(fileKey)) throw new Error("Invalid invoice file key");
  return path.join(INVOICE_STORAGE_DIR, fileKey);
}

export async function saveInvoicePdf(buffer: Buffer) {
  await fs.mkdir(INVOICE_STORAGE_DIR, { recursive: true, mode: 0o700 });
  const fileKey = `${randomBytes(16).toString("hex")}.pdf`;
  const target = resolveKey(fileKey);
  const tmp = `${target}.tmp`;

  // write + rename = atomic, no half-written PDFs
  await fs.writeFile(tmp, buffer, { mode: 0o600, flag: "wx" });
  await fs.rename(tmp, target);

  return {
    fileKey,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    sizeBytes: buffer.length,
  };
}

export async function readInvoicePdf(fileKey: string) {
  return fs.readFile(resolveKey(fileKey));
}

export async function deleteInvoicePdf(fileKey: string) {
  await fs.rm(resolveKey(fileKey), { force: true });
}
