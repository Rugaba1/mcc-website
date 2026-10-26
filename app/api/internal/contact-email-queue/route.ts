import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { processDueContactEmailDeliveries } from "@/lib/contact-email-queue";
import { withRateLimit } from "@/lib/middleware/withRateLimit";

export const runtime = "nodejs";

function hasValidCronSecret(request: NextRequest, secret: string) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ") || authorization.length > 1024) {
    return false;
  }

  const providedHash = createHash("sha256")
    .update(authorization.slice(7))
    .digest();
  const expectedHash = createHash("sha256").update(secret).digest();
  return timingSafeEqual(providedHash, expectedHash);
}

export const POST = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 20,
})(async (request: NextRequest) => {
  const secret = process.env.CONTACT_EMAIL_CRON_SECRET;
  if (!secret || secret.length < 32) {
    console.error("Contact email queue is disabled: CONTACT_EMAIL_CRON_SECRET is not configured.");
    return NextResponse.json(
      { error: "Contact email queue is not configured" },
      { status: 503 },
    );
  }
  if (!hasValidCronSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueContactEmailDeliveries();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Contact email queue processing failed:", error);
    return NextResponse.json(
      { error: "Contact email queue processing failed" },
      { status: 500 },
    );
  }
});
