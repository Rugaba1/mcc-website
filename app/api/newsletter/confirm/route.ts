import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import {
  hashNewsletterToken,
  NEWSLETTER_TOKEN_PATTERN,
} from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function confirmationPage(message: string, token?: string, status = 200) {
  const form = token
    ? `<form method="post" action="/api/newsletter/confirm"><input type="hidden" name="token" value="${token}"><button type="submit">Confirm subscription</button></form>`
    : "";
  return new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newsletter subscription</title><body style="margin:0;background:#fffcf5;color:#1a2b27;font:16px Arial,sans-serif"><main style="max-width:560px;margin:12vh auto;padding:32px;border:1px solid #8f8978;background:#fff"><p style="color:#00574f;font-weight:bold;letter-spacing:.12em;text-transform:uppercase">Mountain Ceramics</p><h1 style="font-family:Georgia,serif">${message}</h1>${form}<p><a href="/">Return to the website</a></p></main><style>button{padding:12px 18px;border:0;background:#00574f;color:#fff;font-weight:bold;cursor:pointer}a{color:#00574f}</style></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!NEWSLETTER_TOKEN_PATTERN.test(token)) {
    return confirmationPage("This confirmation link is invalid or expired.", undefined, 400);
  }
  return confirmationPage(
    "Confirm your newsletter subscription",
    token,
  );
}

export const POST = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 15,
})(async (request: NextRequest) => {
  let token = "";
  try {
    const formData = await request.formData();
    token = String(formData.get("token") ?? "");
  } catch {
    return confirmationPage("This confirmation link is invalid or expired.", undefined, 400);
  }
  if (!NEWSLETTER_TOKEN_PATTERN.test(token)) {
    return confirmationPage("This confirmation link is invalid or expired.", undefined, 400);
  }

  try {
    const now = new Date();
    const result = await prisma.newsletterSubscription.updateMany({
      where: {
        confirmationTokenHash: hashNewsletterToken(token),
        status: "PENDING",
        confirmationExpiresAt: { gt: now },
      },
      data: {
        status: "ACTIVE",
        confirmedAt: now,
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
      },
    });
    if (result.count !== 1) {
      return confirmationPage("This confirmation link is invalid or expired.", undefined, 400);
    }
    return confirmationPage("Your subscription is confirmed. You can unsubscribe at any time using the link in the confirmation email.");
  } catch (error) {
    console.error("POST /api/newsletter/confirm failed:", error);
    return confirmationPage("We could not confirm your subscription. Please try again later.", undefined, 500);
  }
});
