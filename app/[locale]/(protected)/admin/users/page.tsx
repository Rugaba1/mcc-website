"use client";

import { api, type AdminUser } from "@/lib/api";
import { ResourcePage } from "@/components/admin/resource-page";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminUsersPage() {
  return (
    <ResourcePage<AdminUser>
      title="Users"
      description="Accounts that can sign in. Permissions are managed per user."
      entityName="user"
      load={api.getUsers}
      searchText={(u) => `${u.name} ${u.email}`}
      filters={[
        { key: "status", label: "Statuses", options: [{ value: "active", label: "Active" }, { value: "disabled", label: "Disabled" }], match: (u, v) => (v === "active") === u.active },
        { key: "role", label: "Roles", options: [{ value: "admin", label: "Admin" }, { value: "staff", label: "Other" }], match: (u, v) => u.role === v },
      ]}
      columns={[
        { header: "User", cell: (u) => <div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div> },
        { header: "Access", cell: (u) => (u.role === "admin" ? <Badge className="rounded-none">Admin</Badge> : <span className="text-muted-foreground">{u.permissions.length} permission{u.permissions.length === 1 ? "" : "s"}</span>) },
        { header: "Status", cell: (u) => <StatusBadge status={u.active ? "ACTIVE" : "DISABLED"} /> },
        { header: "Joined", cell: (u) => fmtDate(u.createdAt) },
      ]}
      fields={[
        { name: "name", label: "Full name", type: "text", required: true, wide: true },
        { name: "email", label: "Email", type: "email", required: true, wide: true },
        { name: "password", label: "Password", type: "password", hint: "At least 6 characters. When editing, leave blank to keep the current password." },
        { name: "active", label: "Account is active (can sign in)", type: "checkbox" },
      ]}
      emptyForm={{ name: "", email: "", password: "", active: true }}
      toForm={(u) => ({ name: u.name, email: u.email, password: "", active: u.active })}
      validate={(v, editing) => ({
        ...(v.email && !EMAIL.test(v.email) ? { email: "Enter a valid email" } : {}),
        ...(!editing && (v.password ?? "").length < 6 ? { password: "At least 6 characters" } : {}),
        ...(editing && v.password && v.password.length < 6 ? { password: "At least 6 characters" } : {}),
      })}
      create={(v) => api.createUser({ name: v.name.trim(), email: v.email.trim(), password: v.password, active: !!v.active })}
      update={(u, v) => api.updateUser(u.id, { name: v.name.trim(), email: v.email.trim(), active: !!v.active, ...(v.password ? { password: v.password } : {}) })}
      remove={(u) => api.deleteUser(u.id)}
      deleteWarning={(u) => `${u.name} (${u.email}) will lose access. If they have placed orders, consider disabling the account instead.`}
    />
  );
}