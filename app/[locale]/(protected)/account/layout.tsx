import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProtectedRoute } from "@/components/protected-route";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell area="account">{children}</DashboardShell>
    </ProtectedRoute>
  );
}