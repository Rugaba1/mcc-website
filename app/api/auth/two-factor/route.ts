import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withAuth } from "@/lib/middleware/withAuth";
import { prisma } from "@/lib/prisma";

const disableSchema = z.object({
  currentPassword: z.string().min(1).max(200),
}).strict();

export const GET = withAuth(async (_request, { user }) => {
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { twoFactorEnabled: true, twoFactorMethod: true },
  });
  if (!account) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    enabled: account.twoFactorEnabled,
    method: account.twoFactorMethod,
    required: user.permissions.length > 0,
  });
});

export const DELETE = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { currentPassword } = disableSchema.parse(await request.json());
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!account) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (user.permissions.length > 0) {
      return NextResponse.json(
        { error: "Two-factor authentication is required for staff accounts." },
        { status: 403 },
      );
    }
    if (!(await bcrypt.compare(currentPassword, account.password))) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        twoFactorSecret: null,
        twoFactorPendingSecret: null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("Two-factor disable failed:", error);
    return NextResponse.json(
      { error: "Could not disable two-factor authentication." },
      { status: 500 },
    );
  }
});
