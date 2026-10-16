import { ProtectedRoute } from "@/components/protected-route";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell area="account">{children}</DashboardShell>
    </ProtectedRoute>
  );
}