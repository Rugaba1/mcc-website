import { ProtectedRoute } from "@/components/protected-route";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PermissionGate requiredAny={Object.values(PERM)} mode="message">
        <DashboardShell area="admin">{children}</DashboardShell>
      </PermissionGate>
    </ProtectedRoute>
  );
}