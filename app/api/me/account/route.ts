import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth/api-access";
import {
  AccountDeleteError,
  deleteUserAccount,
} from "@/lib/users/delete-account";

const AUTH_COOKIES = ["access_token", "refresh_token", "auth_token"];

export async function DELETE(req: NextRequest) {
  try {
    const me = await getApiUser(req);
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { password } = await req.json().catch(() => ({ password: "" }));
    const row = await prisma.user.findUnique({
      where: { id: me.id },
      select: { password: true },
    });
    if (!password || !row || !(await bcrypt.compare(password, row.password)))
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 403 },
      );

    await deleteUserAccount(me.id);

    const res = NextResponse.json({ ok: true });
    AUTH_COOKIES.forEach((c) => res.cookies.delete(c));
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
}
