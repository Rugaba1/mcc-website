import { checkResetCode } from "@/lib/auth/reset-request";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = verifyOtpSchema.parse(await request.json());

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

    // Don't return the code or any token: the client already has the code
    // and sends it again with the new password.
    return NextResponse.json({ success: true, message: "Code verified." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
