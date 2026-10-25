import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, supportedLocales } from "@/lib/constants";
import { resolveTimeZone, TIME_ZONE_COOKIE_NAME } from "@/lib/timezone";

interface RateLimitOptions {
  interval: number; 
  uniqueTokenPerInterval: number;
}

export type MiddlewareContext = {
  locale: string;
  timeZone: string;
  clientIp: string | null;
  userAgent: string | null;
};

export function withRateLimit(options: RateLimitOptions) {
  const tokenCache = new Map<string, { tokens: number[]; expiresAt: number }>();
  const maxEntries = options.uniqueTokenPerInterval || 500;
  const ttl = options.interval || 60000;

  return function (handler: any) {
    return async (req: NextRequest, context: any) => {
      // Get IP address from headers
      const forwarded = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      const clientIp =
        req.headers.get("cf-connecting-ip")?.trim() ||
        forwarded?.split(",")[0]?.trim() ||
        realIp ||
        null;
      const rateLimitIp =
        forwarded?.split(",")[0] || realIp || clientIp || "anonymous";

      const now = Date.now();
      const cached = tokenCache.get(rateLimitIp);
      if (cached && cached.expiresAt <= now) {
        tokenCache.delete(rateLimitIp);
      }
      const tokenCount = tokenCache.get(rateLimitIp)?.tokens || [0];

      const cacheTokens = (tokens: number[]) => {
        tokenCache.delete(rateLimitIp);
        tokenCache.set(rateLimitIp, { tokens, expiresAt: now + ttl });
        if (tokenCache.size > maxEntries) {
          const oldestIp = tokenCache.keys().next().value;
          if (oldestIp !== undefined) tokenCache.delete(oldestIp);
        }
      };

      if (tokenCount[0] === 0) {
        cacheTokens([1]);
      } else {
        tokenCount[0] += 1;
        cacheTokens(tokenCount);
      }

      const currentUsage = tokenCount[0];
      const isRateLimited =
        currentUsage >= (options.uniqueTokenPerInterval || 10);

      if (isRateLimited) {
        return NextResponse.json(
          { error: "Rate limit exceeded", message: "Too many requests" },
          { status: 429 },
        );
      }

      const locale = req.headers
        .get("accept-language")
        ?.split(",")
        .map((language) => language.split(";")[0].trim().toLowerCase().split("-")[0])
        .find((language) => (supportedLocales as readonly string[]).includes(language))
        ?? defaultLocale;

      const middlewareContext: MiddlewareContext = {
        locale,
        timeZone: resolveTimeZone(req.cookies.get(TIME_ZONE_COOKIE_NAME)?.value),
        clientIp,
        userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      };

      return handler(req, { ...context, ...middlewareContext });
    };
  };
}
