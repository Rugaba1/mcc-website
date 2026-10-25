import type { AuthUser } from "./token-store";

export function isStaffUser(user: AuthUser | null): boolean {
  return Boolean(user?.permissions.length);
}
