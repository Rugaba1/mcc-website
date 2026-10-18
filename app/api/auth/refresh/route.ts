import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  generateAccessToken,
} from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";
import { IS_PROD, ROLE_IDS } from "@/lib/constants";

export const runtime = "nodejs"; // Prisma

const unauthorized = () => {
  const res = NextResponse.json(
    { success: false, message: "Invalid or expired refresh token" },
    { status: 401 },
  );
  // Drop a dead session so the browser stops sending it
  res.cookies.set("refresh_token", "", { path: "/api/auth", maxAge: 0 });
  res.cookies.set("auth_token", "", { path: "/", maxAge: 0 });
  return res;
};

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) return unauthorized();

    const userId = await verifyRefreshToken(refreshToken); // number | null
    if (userId === null) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }, // an array in your schema
    });

    if (!user || !user.isActive) return unauthorized();

    // Same logic as login: lowest ID = most privileged role
    const primaryRole = [...user.role].sort((a, b) => a.id - b.id)[0] ?? {
      id: ROLE_IDS.CUSTOMER,
      roleName: "customer",
    };

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: primaryRole.id,
    });

    const res = NextResponse.json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: { id: primaryRole.id, roleName: primaryRole.roleName },
      },
    });

    // Keep the middleware cookie in step with the new access token
    res.cookies.set("auth_token", accessToken, {
      path: "/",
      maxAge: 15 * 60,
      sameSite: "lax",
      httpOnly: true,
      secure: IS_PROD,
    });

    return res;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
