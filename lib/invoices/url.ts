import { createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/config/site.config";

export const invoicePath = (number: string) =>
  `/api/invoices/${encodeURIComponent(number)}`;

function secret() {
  const s = process.env.INVOICE_URL_SECRET;
  if (!s || s.length < 32)
    throw new Error("INVOICE_URL_SECRET must be set (32+ chars)");
  return s;
}

const sign = (number: string, exp: number) =>
  createHmac("sha256", secret()).update(`${number}.${exp}`).digest("base64url");

export function signedInvoiceUrl(
  number: string,
  ttlSeconds = 60 * 60 * 24 * 7,
) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const base = siteConfig.configuredSiteUrl ?? "";
  return `${base}${invoicePath(number)}?exp=${exp}&sig=${sign(number, exp)}`;
}

export function verifyInvoiceSignature(
  number: string,
  exp: string | null,
  sig: string | null,
) {
  if (!exp || !sig) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Date.now() / 1000) return false;
  const a = Buffer.from(sign(number, expNum));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
