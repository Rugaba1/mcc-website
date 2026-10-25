import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/middleware/withRateLimit";

export const POST = withRateLimit({
  interval: 60 * 60_000,
  uniqueTokenPerInterval: 10,
})(async () =>
  NextResponse.json(
    { success: false, error: "Password reset codes are no longer supported. Use the link sent to your email." },
    { status: 410 },
  ),
);
