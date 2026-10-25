"use client";

import { isAxiosError } from "axios";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { api, apiErrorMessage, type LegalAcceptanceState } from "@/lib/api";
import { safeNext } from "@/lib/auth/safe-next";
import { LEGAL_DOCUMENTS } from "@/lib/legal/constants";
import { LuxuryLoading } from "@/components/luxury-loading";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/auth/form-error";

export default function LegalAcceptancePage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [state, setState] = useState<LegalAcceptanceState | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadAcceptance() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getLegalAcceptance();
      setState(data);
      setSelectedIds(data.acceptedVersionIds);
      if (data.accepted) router.replace(next);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load the current legal documents."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(`/legal/accept?next=${next}`)}`);
      return;
    }
    void loadAcceptance();
  // loadAcceptance intentionally uses the current route and auth state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isInitializing, next, router]);

  const allCurrentVersionsSelected = useMemo(
    () => state !== null &&
      state.legalVersionIds.length > 0 &&
      state.legalVersionIds.every((id) => selectedIds.includes(id)),
    [state, selectedIds],
  );

  function toggle(id: number, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state || !allCurrentVersionsSelected) return;
    setSubmitting(true);
    setError("");
    try {
      await api.acceptLegalDocuments(selectedIds);
      router.replace(next);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save your acceptance."));
      if (isAxiosError(err) && err.response?.status === 409) {
        await loadAcceptance();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const labels = new Map(LEGAL_DOCUMENTS.map(({ type, label, slug }) => [type, { label, slug }]));

  if (isInitializing || loading) {
    return <LuxuryLoading fullScreen label="Loading legal documents" />;
  }

  if (!isAuthenticated) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Review updated legal documents</h1>
      <p className="mt-3 text-muted-foreground">
        Please review and accept the current versions before continuing to your account.
      </p>
      <FormError message={error} />
      {state?.pending.length ? (
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <fieldset className="space-y-4">
            <legend className="mb-4 font-semibold">Documents requiring your acceptance</legend>
            {state.pending.map((document) => {
              const info = labels.get(document.documentType as (typeof LEGAL_DOCUMENTS)[number]["type"]);
              if (!info) return null;
              return (
                <label key={document.id} className="flex items-start gap-3 rounded-md border p-4">
                  <input
                    type="checkbox"
                    required
                    checked={selectedIds.includes(document.id)}
                    onChange={(event) => toggle(document.id, event.target.checked)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span>
                    I have read and accept{" "}
                    <Link
                      href={`/legal/${info.slug}`}
                      target="_blank"
                      className="font-semibold text-primary underline underline-offset-4"
                    >
                      {document.title}
                    </Link>
                    {" "}version {document.version}.
                  </span>
                </label>
              );
            })}
          </fieldset>
          <Button type="submit" disabled={submitting || !allCurrentVersionsSelected}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Accept and continue
          </Button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-muted-foreground">
            {state
              ? "No current published documents need your acceptance."
              : "Unable to load the required documents. Please try again."}
          </p>
          <Button variant="outline" onClick={() => void loadAcceptance()}>Try again</Button>
        </div>
      )}
    </main>
  );
}
