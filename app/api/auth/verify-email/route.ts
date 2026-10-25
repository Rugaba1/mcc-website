import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { prisma } from "@/lib/prisma";
import { verifyEmailVerificationToken } from "@/lib/auth/email-verification";
import { isEmailBlocklisted } from "@/lib/auth/email-blocklist";

const schema = z.object({ token: z.string().min(20).max(2048) }).strict();

export const POST = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 10,
})(async (request: NextRequest) => {
  try {
    const { token } = schema.parse(await request.json());
    const payload = verifyEmailVerificationToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "This verification link is invalid or expired." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: payload.userId, email: payload.email, isActive: true },
      select: { id: true, email: true, emailVerifiedAt: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "This verification link is invalid or expired." },
        { status: 400 },
      );
    }
    if (await isEmailBlocklisted(user.email)) {
      return NextResponse.json(
        { error: "This account cannot be verified. Please contact support." },
        { status: 403 },
      );
    }
    if (!user.emailVerifiedAt) {
      await prisma.user.updateMany({
        where: { id: user.id, email: payload.email, emailVerifiedAt: null },
        data: { emailVerifiedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Email verified. You can now sign in.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });
    }
    console.error("Email verification failed:", error);
    return NextResponse.json(
      { error: "Could not verify email. Please try again." },
      { status: 500 },
    );
  }
});
