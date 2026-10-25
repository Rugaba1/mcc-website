import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth/email-hygiene";
import { createEmailVerificationToken } from "@/lib/auth/email-verification";
import { sendEmailVerificationLink } from "@/lib/email";
import { siteConfig } from "@/config/site.config";

const schema = z.object({
  email: z.string().trim().email().max(254),
  next: z.string().max(2048).optional(),
}).strict();

const genericResponse = {
  success: true,
  message: "If the account needs verification, a link will be sent.",
};

export const POST = withRateLimit({
  interval: 60 * 60_000,
  uniqueTokenPerInterval: 5,
})(async (request: NextRequest) => {
  try {
    const { email: submittedEmail, next } = schema.parse(await request.json());
    const email = normalizeEmail(submittedEmail);
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        isActive: true,
        emailVerifiedAt: true,
      },
    });

    if (user?.isActive && !user.emailVerifiedAt) {
      const token = createEmailVerificationToken(user.id, user.email);
      const origin = siteConfig.configuredSiteUrl
        ? new URL(siteConfig.configuredSiteUrl).origin
        : request.nextUrl.origin;
      const verifyUrl = new URL("/verify-email", origin);
      verifyUrl.searchParams.set("token", token);
      if (next) verifyUrl.searchParams.set("next", next);
      await sendEmailVerificationLink(user.email, user.firstName, verifyUrl.toString());
    }

    return NextResponse.json(genericResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("Resend verification failed:", error);
    return NextResponse.json(
      { error: "Could not send verification link. Please try again." },
      { status: 500 },
    );
  }
});
