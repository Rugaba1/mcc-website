import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordChangedEmail } from "@/lib/email";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { clearRefreshCookie } from "@/lib/auth/csrf";
import { otpBinding, verifyStatelessChallenge } from "@/lib/auth/stateless-otp";
import { isEmailBlocklisted } from "@/lib/auth/email-blocklist";

export const runtime = "nodejs";

const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(2048),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }).strict();

export const POST = withRateLimit({
  interval: 60 * 60_000,
  uniqueTokenPerInterval: 10,
})(async (request: NextRequest) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(
      await request.json(),
    );

    const verified = verifyStatelessChallenge(token, "password-reset");
    const userId = verified && /^\d+$/.test(verified.subject)
      ? Number(verified.subject)
      : Number.NaN;
    const user = Number.isSafeInteger(userId) && userId > 0
      ? await prisma.user.findUnique({
          where: { id: userId },
        })
      : null;
    if (
      !verified ||
      !user?.isActive ||
      (user && (await isEmailBlocklisted(user.email))) ||
      verified.binding !== otpBinding(user.password)
    ) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 },
      );
    }

    const password = await bcrypt.hash(newPassword, 12);

    const changed = await prisma.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id: user.id, isActive: true, password: user.password },
        data: { password },
      });
      if (result.count !== 1) return false;

      await tx.forgetPasswordRequest.deleteMany({
        where: { userId: user.id },
      });
      await tx.refreshToken.updateMany({
        where: { userId: user.id },
        data: { revokedAt: new Date(), replacedById: null },
      });
      return true;
    });
    if (!changed) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 },
      );
    }
    await sendPasswordChangedEmail(
      user.email,
      user.firstName,
    );

    const res = NextResponse.json({
      success: true,
      message:
        "Password reset successfully. Please sign in with your new password.",
    });
    // Drop any session cookies in this browser
    clearRefreshCookie(res);
    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
});
