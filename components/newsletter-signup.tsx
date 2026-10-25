"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { Link } from "@/app/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const result = await api.subscribeNewsletter({
        email,
        consent: true,
        website: String(form.get("website") ?? ""),
      });
      setEmail("");
      setConsent(false);
      toast.success(result.message);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not subscribe. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={subscribe} className="mt-6 max-w-sm space-y-3">
      <label htmlFor="newsletter-email" className="text-xs font-semibold uppercase tracking-wider">
        News and updates
      </label>
      <div className="flex min-w-0 gap-2">
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className="min-w-0 border-inverse-border bg-background text-foreground"
        />
        <Button type="submit" variant="secondary" disabled={submitting || !consent}>
          {submitting ? "Sending" : "Subscribe"}
        </Button>
      </div>
      <label className="flex items-start gap-2 text-xs leading-relaxed text-inverse-foreground/75">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 accent-primary"
          required
        />
        <span>
          I agree to receive occasional product and company updates by email.
          See our{" "}
          <Link href="/legal/privacy-policy" className="underline">
            privacy policy
          </Link>
          . I can unsubscribe at any time.
        </span>
      </label>
      <Input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
    </form>
  );
}
