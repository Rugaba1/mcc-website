import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";
import { sendStatelessOtpEmail } from "@/lib/email";
import {
  authenticatorUri,
  encryptTotpSecret,
  generateTotpSecret,
} from "@/lib/auth/totp";
import { issueStatelessOtp, otpBinding } from "@/lib/auth/stateless-otp";

const setupSchema = z.object({
  method: z.enum(["email", "authenticator"]),
  currentPassword: z.string().min(1).max(200),
}).strict();

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { method, currentPassword } = setupSchema.parse(
      await request.json(),
    );
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        firstName: true,
        password: true,
      },
    });
    if (!account) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (!(await bcrypt.compare(currentPassword, account.password))) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    const issued = issueStatelessOtp(
      {
        purpose: "two-factor-enrollment",
        subject: String(user.id),
        binding: otpBinding(
          `${user.id}:${account.password}:${account.email}:${method}`,
        ),
      },
      5 * 60_000,
    );

    if (method === "email") {
      await sendStatelessOtpEmail(
        account.email,
        issued.code,
        account.firstName,
        "two-factor-enrollment",
      );
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorPendingSecret: `email:${issued.challenge}` },
      });
      return NextResponse.json({
        method,
        challenge: issued.challenge,
        message: "A setup code was sent to your email.",
      });
    }

    const secret = generateTotpSecret();
    const encryptedSecret = encryptTotpSecret(secret);
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorPendingSecret: `totp:${encryptedSecret}` },
    });

    return NextResponse.json({
      method,
      challenge: issued.challenge,
      secret,
      authenticatorUri: authenticatorUri(secret, account.email),
      message: "Add this account to your authenticator app, then enter its code.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("Two-factor setup failed:", error);
    return NextResponse.json(
      { error: "Could not start two-factor setup." },
      { status: 500 },
    );
  }
});
