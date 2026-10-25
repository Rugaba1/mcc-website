import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEmail } from "@/lib/auth/email-hygiene";
import {
  sendNewsletterConfirmation,
} from "@/lib/email";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import {
  createNewsletterToken,
  hashNewsletterToken,
  newsletterActionUrl,
} from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email().max(254),
  consent: z.literal(true),
  website: z.string().optional(),
});

const genericMessage =
  "If this address can receive a subscription, we have emailed a confirmation link.";

export const POST = withRateLimit({
  interval: 60 * 60_000,
  uniqueTokenPerInterval: 5,
})(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email and consent to subscribe." },
      { status: 400 },
    );
  }
  if (parsed.data.website) {
    return NextResponse.json({ message: genericMessage }, { status: 202 });
  }

  try {
    const email = normalizeEmail(parsed.data.email);
    const blocked = await prisma.emailBlocklist.findUnique({
      where: { email },
      select: { isActive: true },
    });
    if (blocked?.isActive) {
      return NextResponse.json({ message: genericMessage }, { status: 202 });
    }

    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email },
      select: { status: true },
    });
    if (existing?.status === "ACTIVE") {
      return NextResponse.json({ message: genericMessage }, { status: 202 });
    }

    const confirmationToken = createNewsletterToken();
    const unsubscribeToken = createNewsletterToken();
    const now = new Date();
    await prisma.newsletterSubscription.upsert({
      where: { email },
      create: {
        email,
        status: "PENDING",
        consentAt: now,
        confirmationTokenHash: hashNewsletterToken(confirmationToken),
        confirmationExpiresAt: new Date(now.getTime() + 24 * 60 * 60_000),
        unsubscribeTokenHash: hashNewsletterToken(unsubscribeToken),
      },
      update: {
        status: "PENDING",
        consentAt: now,
        confirmedAt: null,
        unsubscribedAt: null,
        confirmationTokenHash: hashNewsletterToken(confirmationToken),
        confirmationExpiresAt: new Date(now.getTime() + 24 * 60 * 60_000),
        unsubscribeTokenHash: hashNewsletterToken(unsubscribeToken),
      },
    });

    const sent = await sendNewsletterConfirmation(
      email,
      newsletterActionUrl("confirm", confirmationToken),
      newsletterActionUrl("unsubscribe", unsubscribeToken),
    );
    if (!sent) {
      console.error("Newsletter confirmation email was not delivered.", {
        emailDomain: email.split("@").at(-1),
      });
      return NextResponse.json(
        { error: "We could not send the confirmation email. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json({ message: genericMessage }, { status: 202 });
  } catch (error) {
    console.error("POST /api/newsletter failed:", error);
    return NextResponse.json(
      { error: "Could not process the newsletter request." },
      { status: 500 },
    );
  }
});
