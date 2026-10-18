"use client";

import { useEffect } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/app/i18n/routing";
import { isStaffUser } from "@/lib/roles";

function StaffOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const staff = isStaffUser(user);

  useEffect(() => {
    if (user && !staff) router.replace("/login");
  }, [user, staff, router]);

  return staff ? <>{children}</> : null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
      <StaffOnly>
        <DashboardShell area="admin">{children}</DashboardShell>
      </StaffOnly>
  );
}