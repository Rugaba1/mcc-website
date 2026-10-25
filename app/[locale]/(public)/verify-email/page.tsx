"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/app/i18n/routing";
import { api, apiErrorMessage } from "@/lib/api";
import { safeNext } from "@/lib/auth/safe-next";
import { LuxuryLoading } from "@/components/luxury-loading";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const sent = params.get("sent") === "1";
  const next = safeNext(params.get("next"));
  const [message, setMessage] = useState(sent
    ? "Check your email for a verification link. You can return here after verifying."
    : "Verifying your email…");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!token) {
      if (!sent) setMessage("This verification link is missing or invalid.");
      return;
    }

    let active = true;
    api
      .verifyEmail(token)
      .then(() => {
        if (!active) return;
        setVerified(true);
        setMessage("Your email is verified. Sign in to continue.");
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(apiErrorMessage(error, "This verification link is invalid or expired."));
        }
      });

    return () => {
      active = false;
    };
  }, [sent, token]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-3xl font-bold">Email verification</h1>
      <p aria-live="polite">{message}</p>
      {sent && !token ? (
        <Button variant="outline" onClick={() => router.replace(`/login?next=${encodeURIComponent(next)}`)}>
          Return to sign in
        </Button>
      ) : verified ? (
        <Button onClick={() => router.replace(`/login?next=${encodeURIComponent(next)}`)}>
          Sign in and continue
        </Button>
      ) : (
        <Link href={`/login?next=${encodeURIComponent(next)}`}>
          Return to sign in
        </Link>
      )}
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LuxuryLoading fullScreen label="Loading email verification" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
