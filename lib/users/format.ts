import { PERMISSION_LABELS } from "../auth/permissions-catalog";

export const USER_INCLUDE = {
  permissions: { include: { permission: true } },
} as const;

type UserWithPerms = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  isActive: boolean;
  profilePicture: string | null;
  jobTitle: string | null;
  bio: string | null;
  showOnHomepage: boolean;
  displayOrder: number;
  createdAt: Date;
  permissions: { permission: { code: string } }[];
};

export function formatUser(u: UserWithPerms) {
  const permissions = u.permissions.map((p) => p.permission.code);
  return {
    id: u.id,
    name: `${u.firstName} ${u.lastName || ""}`.trim(),
    email: u.email,
    role: permissions.includes("admin") ? "admin" : "staff",
    active: u.isActive,
    profilePicture: u.profilePicture,
    jobTitle: u.jobTitle,
    bio: u.bio,
    showOnHomepage: u.showOnHomepage,
    displayOrder: u.displayOrder,
    permissions,
    createdAt: u.createdAt,
  };
}

export function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || null };
}

export { PERMISSION_LABELS };
