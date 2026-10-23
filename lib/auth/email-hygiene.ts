import "server-only";

import { Resolver } from "node:dns/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

const DOT_INSENSITIVE = new Set(["gmail.com", "googlemail.com"]);

export const PLUS_ALIASING_DOMAINS = new Set([
  ...DOT_INSENSITIVE,
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "fastmail.com",
  "protonmail.com",
  "proton.me",
  "yahoo.com",
]);

function loadDomainList(fileName: string): Set<string> | null {
  try {
    return new Set(
      readFileSync(join(process.cwd(), fileName), "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim().toLowerCase())
        .filter((line) => line && !line.startsWith("#")),
    );
  } catch (error) {
    console.error(`Could not load ${fileName}; registration is unavailable.`, error);
    return null;
  }
}

const disposableDomains = loadDomainList("disposable_domains.txt");
const disposableMxDomains = loadDomainList("disposable_mx.txt");

export const disposableListsAvailable =
  disposableDomains !== null && disposableMxDomains !== null;

function matchesDomainOrSubdomain(
  domain: string,
  blockedDomains: Set<string>,
) {
  let candidate = domain;
  while (candidate) {
    if (blockedDomains.has(candidate)) return true;
    const dot = candidate.indexOf(".");
    if (dot < 0) return false;
    candidate = candidate.slice(dot + 1);
  }
  return false;
}

export function isDisposable(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@").at(-1) ?? "";
  return disposableDomains
    ? matchesDomainOrSubdomain(domain, disposableDomains)
    : false;
}

export function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at < 0) return normalized;

  let local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);

  if (PLUS_ALIASING_DOMAINS.has(domain)) local = local.split("+", 1)[0];
  if (DOT_INSENSITIVE.has(domain)) local = local.replace(/\./g, "");

  return `${local}@${domain}`;
}

export const MX_OK = "ok";
export const MX_NONE = "no_mx";
export const MX_DISPOSABLE = "disposable_mx";

export type MxVerdict = typeof MX_OK | typeof MX_NONE | typeof MX_DISPOSABLE;
export type EmailEligibility =
  | "ok"
  | "lists_unavailable"
  | "disposable"
  | "no_mx";

const MX_TIMEOUT_MS = 4_000;
const MX_CACHE_TTL_MS = 60 * 60 * 1000;
const MX_ERROR_TTL_MS = 60 * 1000;
const MX_CACHE_MAX = 10_000;
const MX_MAX_CONCURRENT_LOOKUPS = 100;
const resolver = new Resolver({ timeout: MX_TIMEOUT_MS, tries: 1 });
const mxCache = new Map<string, { verdict: MxVerdict; expiresAt: number }>();
const mxPending = new Map<string, Promise<MxVerdict>>();

function errorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : undefined;
}

export function classifyMxHosts(hosts: Iterable<string>): MxVerdict {
  const normalizedHosts = [...hosts].map((host) =>
    host.trim().replace(/\.+$/, "").toLowerCase(),
  );
  if (!normalizedHosts.some(Boolean)) return MX_NONE;

  if (
    disposableMxDomains &&
    normalizedHosts.some((host) =>
      matchesDomainOrSubdomain(host, disposableMxDomains),
    )
  ) {
    return MX_DISPOSABLE;
  }

  return MX_OK;
}

async function resolveImplicitMx(
  domain: string,
): Promise<{ verdict: MxVerdict; ttl: number }> {
  for (const resolveAddress of [
    (host: string) => resolver.resolve4(host),
    (host: string) => resolver.resolve6(host),
  ]) {
    try {
      await resolveAddress(domain);
      return { verdict: MX_OK, ttl: MX_CACHE_TTL_MS };
    } catch (error) {
      const code = errorCode(error);
      if (code === "ENODATA" || code === "ENOTFOUND") continue;
      return { verdict: MX_OK, ttl: MX_ERROR_TTL_MS };
    }
  }
  return { verdict: MX_NONE, ttl: MX_ERROR_TTL_MS };
}

async function resolveMxVerdict(
  domain: string,
): Promise<{ verdict: MxVerdict; ttl: number }> {
  try {
    const answers = await resolver.resolveMx(domain);
    return {
      verdict: classifyMxHosts(answers.map((answer) => answer.exchange)),
      ttl: MX_CACHE_TTL_MS,
    };
  } catch (error) {
    const code = errorCode(error);
    if (code === "ENOTFOUND") {
      return { verdict: MX_NONE, ttl: MX_ERROR_TTL_MS };
    }
    if (code === "ENODATA") return resolveImplicitMx(domain);

    console.warn("Email MX lookup failed; allowing the address temporarily.", {
      code: code ?? "UNKNOWN",
    });
    return { verdict: MX_OK, ttl: MX_ERROR_TTL_MS };
  }
}

export async function mxVerdict(email: string): Promise<MxVerdict> {
  const domain = email.trim().toLowerCase().split("@").at(-1) ?? "";
  if (!domain) return MX_NONE;

  const now = performance.now();
  const cached = mxCache.get(domain);
  if (cached && cached.expiresAt > now) return cached.verdict;

  const pending = mxPending.get(domain);
  if (pending) return pending;
  if (mxPending.size >= MX_MAX_CONCURRENT_LOOKUPS) {
    console.warn("Email MX lookup capacity reached; allowing this address temporarily.");
    return MX_OK;
  }

  const lookup = resolveMxVerdict(domain)
    .then(({ verdict, ttl }) => {
      while (mxCache.size >= MX_CACHE_MAX) {
        const oldest = mxCache.keys().next().value;
        if (oldest === undefined) break;
        mxCache.delete(oldest);
      }
      mxCache.set(domain, { verdict, expiresAt: performance.now() + ttl });
      return verdict;
    })
    .finally(() => {
      mxPending.delete(domain);
    });

  mxPending.set(domain, lookup);
  return lookup;
}

export async function checkEmailEligibility(
  email: string,
): Promise<EmailEligibility> {
  if (!disposableListsAvailable) return "lists_unavailable";
  if (isDisposable(email)) return "disposable";

  const verdict = await mxVerdict(email);
  if (verdict === MX_DISPOSABLE) return "disposable";
  if (verdict === MX_NONE) return "no_mx";
  return "ok";
}
