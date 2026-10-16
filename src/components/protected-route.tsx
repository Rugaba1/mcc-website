"use client";

import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02FreeIcons } from "@hugeicons/core-free-icons";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "@/app/i18n/routing";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // locale-less path from next-intl

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isInitializing, isAuthenticated, pathname, router]);

  // Never render protected children until we know the user is signed in
  if (isInitializing || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <HugeiconsIcon icon={Loading02FreeIcons} className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}