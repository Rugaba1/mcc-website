import { NextRequest, NextResponse } from "next/server";
import { verifyAccessPayload, type AccessClaims } from "@/lib/auth/jwt";
import { STAFF_ROLES } from "@/lib/constants";

type Result =
  | { claims: AccessClaims; error?: undefined }
  | { claims?: undefined; error: NextResponse };

export async function requireStaff(request: NextRequest): Promise<Result> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ")
    ? auth.slice(7)
    : request.cookies.get("auth_token")?.value;

  const claims = token ? await verifyAccessPayload(token) : null;
  if (!claims) {
    return {
      error: NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  if (!(STAFF_ROLES as readonly number[]).includes(claims.role ?? -1)) {
    return {
      error: NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  return { claims };
}
