import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withAuth";
import {
  AccountDeleteError,
  deleteUserAccount,
} from "@/lib/users/delete-account";
import { clearRefreshCookie } from "@/lib/auth/csrf";

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { password } = await req.json().catch(() => ({ password: "" }));
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });
    if (!password || !row || !(await bcrypt.compare(password, row.password)))
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 403 },
      );

    await deleteUserAccount(user.id);

    const res = NextResponse.json({ ok: true });
    clearRefreshCookie(res);
    return res;
  } catch (err) {
    if (err instanceof AccountDeleteError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("DELETE /api/me/account:", err);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
});
