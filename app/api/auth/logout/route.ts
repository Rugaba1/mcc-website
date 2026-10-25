// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { clearRefreshCookie, hasValidAuthRequestHeaders } from "@/lib/auth/csrf";
import { revokeRefreshSession } from "@/lib/auth/refresh-tokens";

export const POST = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 30,
})(async (request: NextRequest) => {
  if (!hasValidAuthRequestHeaders(request)) {
    return NextResponse.json({ error: "Invalid auth request" }, { status: 403 });
  }

  try {
    await revokeRefreshSession(request.cookies.get("refresh_token")?.value);
    const resp = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 },
    );
    clearRefreshCookie(resp);
    return resp;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
});
