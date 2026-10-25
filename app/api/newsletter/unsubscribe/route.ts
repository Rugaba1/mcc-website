import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import {
  hashNewsletterToken,
  NEWSLETTER_TOKEN_PATTERN,
} from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function unsubscribePage(message: string, token?: string, status = 200) {
  const form = token
    ? `<form method="post" action="/api/newsletter/unsubscribe"><input type="hidden" name="token" value="${token}"><button type="submit">Unsubscribe</button></form>`
    : "";
  return new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newsletter preferences</title><body style="margin:0;background:#fffcf5;color:#1a2b27;font:16px Arial,sans-serif"><main style="max-width:560px;margin:12vh auto;padding:32px;border:1px solid #8f8978;background:#fff"><p style="color:#00574f;font-weight:bold;letter-spacing:.12em;text-transform:uppercase">Mountain Ceramics</p><h1 style="font-family:Georgia,serif">${message}</h1>${form}<p><a href="/">Return to the website</a></p></main><style>button{padding:12px 18px;border:0;background:#00574f;color:#fff;font-weight:bold;cursor:pointer}a{color:#00574f}</style></body></html>`,
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
    return unsubscribePage("This unsubscribe link is invalid.", undefined, 400);
  }
  return unsubscribePage("Unsubscribe from newsletter updates?", token);
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
    return unsubscribePage("This unsubscribe link is invalid.", undefined, 400);
  }
  if (!NEWSLETTER_TOKEN_PATTERN.test(token)) {
    return unsubscribePage("This unsubscribe link is invalid.", undefined, 400);
  }

  try {
    const result = await prisma.newsletterSubscription.updateMany({
      where: {
        unsubscribeTokenHash: hashNewsletterToken(token),
        status: { not: "UNSUBSCRIBED" },
      },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
      },
    });
    const campaignRecipient =
      result.count === 1
        ? null
        : await prisma.newsletterCampaignRecipient.findUnique({
            where: { unsubscribeTokenHash: hashNewsletterToken(token) },
            select: { subscriptionId: true },
          });
    if (campaignRecipient) {
      await prisma.newsletterSubscription.updateMany({
        where: {
          id: campaignRecipient.subscriptionId,
          status: { not: "UNSUBSCRIBED" },
        },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
          confirmationTokenHash: null,
          confirmationExpiresAt: null,
        },
      });
    } else if (result.count !== 1) {
      const alreadyUnsubscribed = await prisma.newsletterSubscription.findFirst({
        where: {
          status: "UNSUBSCRIBED",
          OR: [
            { unsubscribeTokenHash: hashNewsletterToken(token) },
            {
              campaignRecipients: {
                some: { unsubscribeTokenHash: hashNewsletterToken(token) },
              },
            },
          ],
        },
        select: { id: true },
      });
      if (!alreadyUnsubscribed) {
        return unsubscribePage("This unsubscribe link is invalid.", undefined, 400);
      }
    }
    return unsubscribePage("You have been unsubscribed from newsletter updates.");
  } catch (error) {
    console.error("POST /api/newsletter/unsubscribe failed:", error);
    return unsubscribePage("We could not update your preferences. Please try again later.", undefined, 500);
  }
});
