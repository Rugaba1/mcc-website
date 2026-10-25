import { NextRequest, NextResponse } from "next/server";
import { generateAccessToken } from "@/lib/auth/jwt";
import { IS_PROD, ROLE_IDS, WEEK } from "@/lib/constants";
import { rotateRefreshSession } from "@/lib/auth/refresh-tokens";
import { hasValidAuthRequestHeaders, clearRefreshCookie } from "@/lib/auth/csrf";
import { permissionsForAccount } from "@/lib/permissions/core";
import { withRateLimit } from "@/lib/middleware/withRateLimit";

export const runtime = "nodejs";

const unauthorized = () => {
  const response = NextResponse.json(
    { success: false, message: "Invalid or expired refresh token" },
    { status: 401 },
  );
  clearRefreshCookie(response);
  return response;
};

export const POST = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 20,
})(async (request: NextRequest) => {
  if (!hasValidAuthRequestHeaders(request)) {
    return NextResponse.json({ error: "Invalid auth request" }, { status: 403 });
  }

  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) return unauthorized();

    const result = await rotateRefreshSession(refreshToken, request);
    if (result.status === "invalid") return unauthorized();
    if (result.status === "retry") {
      return NextResponse.json(
        { success: false, message: "Refresh already in progress" },
        { status: 409 },
      );
    }

    const { user } = result;
    const isRegular = user.role.some((role) => role.id === ROLE_IDS.CUSTOMER);
    const permissions = [
      ...permissionsForAccount(
        user.permissions.map(({ permission }) => permission.code),
        isRegular ? "regular" : "staff",
      ),
    ];
    const primaryRole = [...user.role].sort((a, b) => a.id - b.id)[0] ?? {
      id: ROLE_IDS.CUSTOMER,
      roleName: "customer",
    };
    const accessToken = await generateAccessToken({
      userId: user.id,
      sessionId: result.sessionId,
      permissions,
    });

    const response = NextResponse.json({
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
        permissions,
      },
    });

    response.cookies.set("refresh_token", result.token, {
      path: "/api/auth",
      maxAge: WEEK,
      sameSite: "lax",
      httpOnly: true,
      secure: IS_PROD,
    });

    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
});
