import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";
import { decryptTotpSecret, verifyTotp } from "@/lib/auth/totp";
import {
  otpBinding,
  verifyStatelessChallenge,
  verifyStatelessOtp,
} from "@/lib/auth/stateless-otp";

const confirmSchema = z.object({
  method: z.enum(["email", "authenticator"]),
  challenge: z.string().min(20).max(2048),
  code: z.string().regex(/^\d{6}$/),
}).strict();

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { method, challenge, code } = confirmSchema.parse(
      await request.json(),
    );
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        password: true,
        twoFactorPendingSecret: true,
      },
    });
    if (!account) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const verified =
      method === "email"
        ? verifyStatelessOtp(challenge, code, "two-factor-enrollment")
        : verifyStatelessChallenge(challenge, "two-factor-enrollment");
    const expectedPendingPrefix = method === "email" ? "email:" : "totp:";
    if (
      !verified ||
      verified.subject !== String(user.id) ||
      verified.binding !==
        otpBinding(
          `${user.id}:${account.password}:${account.email}:${method}`,
        ) ||
      !account.twoFactorPendingSecret?.startsWith(expectedPendingPrefix) ||
      (method === "email" &&
        account.twoFactorPendingSecret !== `email:${challenge}`) ||
      (method === "authenticator" &&
        !verifyTotp(
          decryptTotpSecret(
            account.twoFactorPendingSecret.slice("totp:".length),
          ),
          code,
        ))
    ) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 400 },
      );
    }

    const secret =
      method === "authenticator"
        ? account.twoFactorPendingSecret.slice("totp:".length)
        : null;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: method,
        twoFactorSecret: secret,
        twoFactorPendingSecret: null,
      },
    });

    return NextResponse.json({
      success: true,
      enabled: true,
      method,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("Two-factor confirmation failed:", error);
    return NextResponse.json(
      { error: "Could not confirm two-factor setup." },
      { status: 500 },
    );
  }
});
