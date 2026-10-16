import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  generateResetCode,
  hashResetCode,
  RESET_CODE_TTL_MS,
} from "@/lib/auth/reset-code";

export const runtime = "nodejs"; // reset-code.ts uses node:crypto

const RESEND_COOLDOWN_MS = 60 * 1000;

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const GENERIC_OK = {
  success: true,
  message:
    "If an account with that email exists, a password reset code has been sent.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return NextResponse.json(GENERIC_OK, { status: 200 });
    }

    // Cooldown: ignore a repeat request within a minute of the last code
    const latest = await prisma.forgetPasswordRequest.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return NextResponse.json(GENERIC_OK, { status: 200 });
    }

    const code = generateResetCode();
    const codeHash = hashResetCode(String(user.id), code);

    // Replace any older request so only one code is valid at a time
    await prisma.$transaction([
      prisma.forgetPasswordRequest.deleteMany({ where: { userId: user.id } }),
      prisma.forgetPasswordRequest.create({
        data: {
          userId: user.id,
          codeHash,
          expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
        },
      }),
    ]);

    await sendPasswordResetEmail(user.email, code, user.firstName);

    return NextResponse.json(GENERIC_OK, { status: 200 });
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
}
