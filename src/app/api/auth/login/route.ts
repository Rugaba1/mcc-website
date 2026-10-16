import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { IS_PROD, ROLE_IDS, WEEK } from "@/lib/constants";

export const runtime = "nodejs"; // bcryptjs + Prisma

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(200),
});

// Compared against when the user doesn't exist, so response time doesn't reveal which emails are registered
let dummyHash: string | null = null;
const getDummyHash = () =>
  (dummyHash ??= bcrypt.hashSync("not-a-real-password", 10));

const invalid = () =>
  NextResponse.json(
    { success: false, message: "Invalid credentials" },
    { status: 401 },
  );

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = loginSchema.parse(await request.json());

    const user = await prisma.user.findFirst({
      where: identifier.includes("@")
        ? { email: identifier.toLowerCase() }
        : { phoneNumber: identifier },
      include: { role: true }, // an array in your schema
    });

    // Always run one bcrypt comparison
    const passwordOk = await bcrypt.compare(
      password,
      user?.password ?? getDummyHash(),
    );
    if (!user || !passwordOk) return invalid();

    // Only reveal "inactive" after the password is verified
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is not active. Please contact support.",
        },
        { status: 403 },
      );
    }

    // A user can hold several roles. The lowest ID is the most privileged,
    // because ROLE_IDS puts staff roles (1-6) ahead of contractor/customer (7-9).
    const primaryRole = [...user.role].sort((a, b) => a.id - b.id)[0] ?? {
      id: ROLE_IDS.CUSTOMER,
      roleName: "customer",
    };

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: primaryRole.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      generateAccessToken(tokenPayload),
      generateRefreshToken(tokenPayload),
    ]);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const res = NextResponse.json({
      success: true,
      message: "Login successful",
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

    // Long-lived, JS can't read it, only sent to the auth endpoints
    res.cookies.set("refresh_token", refreshToken, {
      path: "/api/auth",
      maxAge: WEEK, // seconds, matches the 7d JWT
      sameSite: "lax",
      httpOnly: true,
      secure: IS_PROD,
    });

    // Short-lived copy so the middleware can guard /account and /admin pages
    res.cookies.set("auth_token", accessToken, {
      path: "/",
      maxAge: 15 * 60, // matches the 15m JWT
      sameSite: "lax",
      httpOnly: true,
      secure: IS_PROD,
    });

    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
