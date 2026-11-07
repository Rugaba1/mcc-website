import type { NextRequest } from "next/server";
import { siteConfig } from "@/config/site.config";

export function hasValidAuthRequestHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return false;
  }

  const allowedOrigins = [...siteConfig.allowedOrigins];

  if (!siteConfig.isProduction) {
    allowedOrigins.push(request.nextUrl.origin);
    if (origin) {
      try {
        const parsedOrigin = new URL(origin);
        const isLocalOrigin =
          parsedOrigin.origin === origin &&
          ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
            parsedOrigin.hostname.toLowerCase(),
          );
        if (isLocalOrigin) allowedOrigins.push(parsedOrigin.origin);
      } catch {
        return false;
      }
    }
  }

  return allowedOrigins.includes(origin);
}

export function clearRefreshCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `refresh_token=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax${siteConfig.isProduction ? "; Secure" : ""}`,
  );
}
