import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { checkResetCode } from "../../../../lib/auth/reset-request";

export const runtime = "nodejs";

const resetPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Code must be 6 digits"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(200),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = resetPasswordSchema.parse(
      await request.json(),
    );

    const result = await checkResetCode(email, otp);
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired code. Please request a new one.",
        },
        { status: 400 },
      );
    }

    const password = await bcrypt.hash(newPassword, 12);

    // Change the password and burn every reset request for this user together
    await prisma.$transaction([
      prisma.user.update({ where: { id: result.user.id }, data: { password } }),
      prisma.forgetPasswordRequest.deleteMany({
        where: { userId: result.user.id },
      }),
    ]);

    const res = NextResponse.json({
      success: true,
      message:
        "Password reset successfully. Please sign in with your new password.",
    });
    // Drop any session cookies in this browser
    res.cookies.set("refresh_token", "", { path: "/api/auth", maxAge: 0 });
    res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
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
}
