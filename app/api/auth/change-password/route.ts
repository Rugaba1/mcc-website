import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withAuth";
import { sendPasswordChangedEmail } from "@/lib/email";

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const account = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      account.password,
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Current password is incorrect",
        },
        { status: 400 },
      );
    }

    const isSamePassword = await bcrypt.compare(newPassword, account.password);
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password must be different from current password",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      });
      await tx.refreshToken.updateMany({
        where: { userId: account.id },
        data: { revokedAt: new Date(), replacedById: null },
      });
    });
    await sendPasswordChangedEmail(account.email, account.firstName);

    return NextResponse.json(
      {
        success: true,
        message: "Password changed successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    console.error("Change password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
});
