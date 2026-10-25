import { z } from "zod";
import {
  ADMIN_CODE,
  ALL_PERMISSION_CODES,
  REGULAR_PERMISSION_CODES,
} from "./catalog";

const permissionCodes = z
  .array(z.string())
  .max(ALL_PERMISSION_CODES.length + REGULAR_PERMISSION_CODES.length)
  .refine((codes) => new Set(codes).size === codes.length)
  .refine((codes) =>
    codes.every(
      (code) =>
        ALL_PERMISSION_CODES.includes(code) ||
        REGULAR_PERMISSION_CODES.includes(code),
    ),
  );

export function validatePermissionAssignment(
  value: unknown,
  actorPermissions: readonly string[],
  options: { accountType?: "staff" | "regular" } = {},
): string | null {
  const parsed = permissionCodes.safeParse(value);
  if (!parsed.success) return "Invalid permissions.";
  const accountType = options.accountType ?? "staff";
  const allowedCodes =
    accountType === "regular" ? REGULAR_PERMISSION_CODES : ALL_PERMISSION_CODES;
  if (!parsed.data.every((code) => allowedCodes.includes(code))) {
    return accountType === "regular"
      ? "Regular accounts can only be assigned customer permissions."
      : "Staff accounts can only be assigned administrative permissions.";
  }

  if (
    accountType === "staff" &&
    !actorPermissions.includes(ADMIN_CODE) &&
    parsed.data.some((code) => !actorPermissions.includes(code))
  ) {
    return "You can only assign permissions you already have.";
  }

  return null;
}
