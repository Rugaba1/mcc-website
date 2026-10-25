import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { siteConfig } from "@/config/site.config";

export const NEWSLETTER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createNewsletterToken() {
  return randomBytes(32).toString("base64url");
}

export function hashNewsletterToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newsletterActionUrl(
  action: "confirm" | "unsubscribe",
  token: string,
) {
  const baseUrl = new URL(siteConfig.siteUrl);
  if (siteConfig.isProduction && baseUrl.protocol !== "https:") {
    throw new Error("Newsletter links require an HTTPS site URL in production.");
  }
  const url = new URL(`/api/newsletter/${action}`, baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}
