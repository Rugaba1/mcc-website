import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordResetLink } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth/email-hygiene";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { issueStatelessChallenge, otpBinding } from "@/lib/auth/stateless-otp";
import { isEmailBlocklisted } from "@/lib/auth/email-blocklist";
import { siteConfig } from "@/config/site.config";

export const runtime = "nodejs";

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
}).strict();

const genericMessage =
  "If an account with that email exists, a password reset link has been sent.";

export const POST = withRateLimit({
  interval: 60 * 60_000,
  uniqueTokenPerInterval: 5,
})(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const normalizedEmail = normalizeEmail(email);
    const user =
      (await prisma.user.findUnique({ where: { email: normalizedEmail } })) ??
      (normalizedEmail === email
        ? null
        : await prisma.user.findUnique({ where: { email } }));

    if (user?.isActive && !(await isEmailBlocklisted(user.email))) {
      const token = issueStatelessChallenge(
        {
          purpose: "password-reset",
          subject: String(user.id),
          binding: otpBinding(user.password),
        },
        30 * 60_000,
      );
      const configuredSiteUrl = siteConfig.configuredSiteUrl;
      if (!configuredSiteUrl && siteConfig.isProduction) {
        throw new Error("A public site URL must be configured in production");
      }
      const siteUrl = new URL(configuredSiteUrl ?? request.nextUrl.origin);
      if (siteConfig.isProduction && siteUrl.protocol !== "https:") {
        throw new Error("Password reset links must use HTTPS in production");
      }
      const origin = siteUrl.origin;
      const resetUrl = new URL("/forgot-password", origin);
      resetUrl.searchParams.set("token", token);
      await sendPasswordResetLink(
        user.email,
        user.firstName,
        resetUrl.toString(),
      );
    }

    return NextResponse.json(
      { success: true, message: genericMessage },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
});
