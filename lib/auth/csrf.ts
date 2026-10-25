import type { NextRequest } from "next/server";
import { siteConfig } from "@/config/site.config";

export function hasValidAuthRequestHeaders(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || request.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return false;
  }

  const allowedOrigins = [...siteConfig.allowedOrigins];

  if (allowedOrigins.length === 0 && !siteConfig.isProduction) {
    allowedOrigins.push(request.nextUrl.origin);
  }

  return allowedOrigins.includes(origin);
}

export function clearRefreshCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `refresh_token=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax${siteConfig.isProduction ? "; Secure" : ""}`,
  );
}
