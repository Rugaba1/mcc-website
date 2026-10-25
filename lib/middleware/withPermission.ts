import { NextResponse } from "next/server";
import { AuthenticatedHandler, withAuth } from "./withAuth";
import { PermCode } from "../permissions/catalog";
import { hasPermissions } from "../permissions/core";
 

export function withPermission(
  requiredPermissions: PermCode | PermCode[],
  rateLimitOptions: { interval?: number; uniqueTokenPerInterval?: number } = {},
) {
  const required = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return function (handler: AuthenticatedHandler) {
    return withAuth(async (req, context) => {
      if (!hasPermissions(context.user.permissions, required)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return handler(req, context);
    }, rateLimitOptions);
  };
}
