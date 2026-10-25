"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useAuth } from "../contexts/auth-context";
import { useRouter, usePathname } from "@/app/i18n/routing";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { LuxuryLoading } from "@/components/luxury-loading";

type GateStatus = "checking" | "ready" | "error";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // locale-less path from next-intl
  const [gateStatus, setGateStatus] = useState<GateStatus>("checking");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isInitializing, isAuthenticated, pathname, router]);

  useEffect(() => {
    if (isInitializing || !isAuthenticated) return;
    if (pathname === "/admin/legal" || pathname.startsWith("/admin/legal/")) {
      setGateStatus("ready");
      return;
    }

    let cancelled = false;
    setGateStatus("checking");
    api.getLegalAcceptance()
      .then((data) => {
        if (cancelled) return;
        if (data.accepted) {
          setGateStatus("ready");
          return;
        }
        router.replace(`/legal/accept?next=${encodeURIComponent(pathname)}`);
      })
      .catch(() => {
        if (!cancelled) setGateStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isInitializing, pathname, retryKey, router]);

  // Never render protected children until we know the user is signed in
  if (isInitializing || !isAuthenticated || gateStatus === "checking") {
    return <LuxuryLoading fullScreen label="Verifying account access" />;
  }

  if (gateStatus === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p role="alert" className="text-muted-foreground">
          We could not verify whether you have accepted the latest legal documents.
        </p>
        <Button variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
          Try again
        </Button>
      </main>
    );
  }

  return <>{children}</>;
}