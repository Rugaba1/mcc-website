"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/app/i18n/routing";
import { safeNext } from "@/lib/auth/safe-next";
import { LuxuryLoading } from "@/components/luxury-loading";
import { Button } from "@/components/ui/button";

function AccountDisabledContent() {
  const next = safeNext(useSearchParams().get("next"));

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-3xl font-bold">Account access unavailable</h1>
      <p className="text-muted-foreground" role="status">
        This account cannot sign in right now. If you think this is a mistake,
        contact our team for assistance.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href={`/contact?subject=${encodeURIComponent("Account access")}`}>
            Contact support
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            Return to sign in
          </Link>
        </Button>
      </div>
    </main>
  );
}

export default function AccountDisabledPage() {
  return (
    <Suspense fallback={<LuxuryLoading fullScreen label="Loading account status" />}>
      <AccountDisabledContent />
    </Suspense>
  );
}
