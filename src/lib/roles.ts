import { STAFF_ROLES } from "@/lib/constants";
import type { AuthUser } from "@/lib/token-store";

export function isStaffUser(user: AuthUser | null): boolean {
  if (!user) return false;
  return (STAFF_ROLES as readonly number[]).includes(Number(user.role.id));
}
