"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Link, useRouter } from "@/app/i18n/routing";
import { api, apiErrorMessage } from "@/lib/api";
import { safeNext } from "@/lib/auth/safe-next";
import { useAuth } from "@/contexts/auth-context";
import { LuxuryLoading } from "@/components/luxury-loading";
import { FormError } from "@/components/auth/form-error";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";

function RegisterForm() {
    const params = useSearchParams();
    const router = useRouter();
    const { login } = useAuth();
    const next = safeNext(params.get("next"));
    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", phoneNumber: "", password: "", confirm: "",
    });
    const [error, setError] = useState("");
    const [accountCreated, setAccountCreated] = useState(false);
    const [challenge, setChallenge] = useState<{
        challenge: string;
        method: "email" | "authenticator";
        message: string;
    } | null>(null);
    const [code, setCode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [legalDocuments, setLegalDocuments] = useState<Array<{ id: number; slug: string; title: string; version: number }>>([]);
    const [selectedLegalIds, setSelectedLegalIds] = useState<number[]>([]);
    const [legalLoading, setLegalLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        api.getCurrentLegalDocuments()
            .then((data) => {
                if (cancelled) return;
                setLegalDocuments(data.documents);
                if (data.documents.length !== 3) {
                    setError("Account registration is temporarily unavailable while legal documents are being prepared.");
                }
            })
            .catch((err) => {
                if (!cancelled) setError(apiErrorMessage(err, "Could not load the required legal documents."));
            })
            .finally(() => !cancelled && setLegalLoading(false));
        return () => { cancelled = true; };
    }, []);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    async function signInAfterRegistration(verification?: {
        challenge: string;
        code: string;
    }) {
        setError("");
        setSubmitting(true);
        try {
            const result = await login(
                form.email.trim(),
                form.password,
                next,
                verification,
            );
            if ("twoFactorRequired" in result && result.twoFactorRequired) {
                setChallenge({
                    challenge: result.challenge,
                    method: result.method,
                    message: result.message,
                });
                setCode("");
            } else if ("accountDisabled" in result || "emailVerificationRequired" in result) {
                setError("Your account was created, but automatic sign-in could not be completed. Please sign in to continue.");
            }
        } catch (err) {
            setError(
                `Your account was created, but automatic sign-in failed. ${apiErrorMessage(err, "Please sign in to continue.")}`,
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        if (challenge) {
            if (code.length !== 6) return;
            await signInAfterRegistration({ challenge: challenge.challenge, code });
            return;
        }
        if (form.password.length < 8) return setError("Password must be at least 8 characters.");
        if (form.password !== form.confirm) return setError("Passwords don't match.");
        if (form.phoneNumber && !isValidPhoneNumber(form.phoneNumber)) {
            return setError("Please enter a valid phone number.");
        }

        setSubmitting(true);
        try {
            await api.register({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim() || undefined,
                password: form.password,
                acceptedLegalVersionIds: selectedLegalIds,
                next,
            });
            setAccountCreated(true);
            await signInAfterRegistration();
        } catch (err) {
            setError(apiErrorMessage(err, "Could not create your account."));
            setSubmitting(false);
        }
    }

    if (accountCreated) {
        return (
            <main className="mx-auto max-w-xl px-4 py-16 text-center">
                <h1 className="text-3xl font-bold">
                    {challenge ? "Verify it’s you" : "Signing you in"}
                </h1>
                {challenge ? (
                    <form onSubmit={onSubmit} className="mx-auto mt-6 max-w-sm space-y-4">
                        <p className="text-sm text-muted-foreground" aria-live="polite">
                            {challenge.message}
                        </p>
                        <div className="space-y-2 text-left">
                            <Label htmlFor="registration-two-factor-code">6-digit verification code</Label>
                            <OtpInput
                                id="registration-two-factor-code"
                                value={code}
                                onChange={setCode}
                                autoFocus
                            />
                        </div>
                        <FormError message={error} />
                        <Button type="submit" className="w-full" disabled={submitting || code.length !== 6}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify and sign in
                        </Button>
                        {challenge.method === "email" && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={submitting}
                                onClick={() => signInAfterRegistration()}
                            >
                                Send another code
                            </Button>
                        )}
                    </form>
                ) : error ? (
                    <>
                        <p className="mt-4 text-muted-foreground">
                            Your account is ready, but automatic sign-in did not finish.
                        </p>
                        <FormError message={error} />
                        <Button
                            className="mt-6"
                            onClick={() =>
                                router.replace(`/login?next=${encodeURIComponent(next)}`)
                            }
                        >
                            Continue to sign in
                        </Button>
                    </>
                ) : (
                    <p className="mt-4 text-muted-foreground" aria-live="polite">
                        Your account is ready. Please wait while we sign you in.
                    </p>
                )}
            </main>
        );
    }

    return (
        
            <div className="max-w-7xl mx-auto text-center">
            <div>
                <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
                    <span className="w-8 h-px bg-primary" />
                    Mountain Ceramics Company
                    <span className="w-8 h-px bg-primary" />
                </span>
                <h1 className="font-bold text-4xl md:text-5xl  leading-tight">
                        Create your account
                </h1>
                <p className=" text-lg max-w-2xl mx-auto">
                        Track orders and save your favourite tiles
                </p>
            </div>

        <div className="flex  py-12 items-center justify-center px-4 ">
            <div className="w-full max-w-md  border border-border bg-background p-8 shadow-xl">
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input id="firstName" autoComplete="given-name" required maxLength={80} value={form.firstName} onChange={set("firstName")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input id="lastName" autoComplete="family-name" required maxLength={80} value={form.lastName} onChange={set("lastName")} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={set("email")} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <PhoneInput
                        id="phone"
                        name="phoneNumber"
                        international
                        defaultCountry="RW"
                        countryCallingCodeEditable={false}
                        autoComplete="tel"
                        placeholder="Enter phone number"
                        value={form.phoneNumber}
                        onChange={(phoneNumber) =>
                            setForm((current) => ({ ...current, phoneNumber }))
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput id="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" value={form.password} onChange={set("password")} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <PasswordInput id="confirm" autoComplete="new-password" required value={form.confirm} onChange={set("confirm")} />
                </div>

                <fieldset className="space-y-3 rounded-md border p-4">
                    <legend className="px-1 text-sm font-semibold">Legal agreements</legend>
                    {legalLoading ? (
                        <p className="text-sm text-muted-foreground" aria-live="polite">Loading current legal documents…</p>
                    ) : legalDocuments.map((document) => (
                        <label key={document.id} className="flex items-start gap-3 text-sm">
                            <input
                                type="checkbox"
                                required
                                checked={selectedLegalIds.includes(document.id)}
                                onChange={(event) => setSelectedLegalIds((current) =>
                                    event.target.checked
                                        ? [...new Set([...current, document.id])]
                                        : current.filter((id) => id !== document.id),
                                )}
                                className="mt-1 size-4 accent-primary"
                            />
                            <span>
                                I have read and accept the{" "}
                                <Link href={`/legal/${document.slug}`} target="_blank" className="font-semibold text-primary underline underline-offset-4">
                                    {document.title} (version {document.version})
                                </Link>.
                            </span>
                        </label>
                    ))}
                    {legalDocuments.length !== 3 && !legalLoading && (
                        <p className="text-sm text-destructive" role="status">
                            Registration will be available after all required legal documents are published.
                        </p>
                    )}
                </fieldset>

                <FormError message={error} />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting || legalLoading || legalDocuments.length !== 3 || selectedLegalIds.length !== 3}
                >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitting ? "Creating account…" : "Create account"}
                </Button>
            </form>
                <>
                    Already have an account?{" "}
                    <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline px-2.5 font-serif">
                        Sign in
                    </Link>
                </>
         </div>
            </div>
            </div>
        
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<LuxuryLoading fullScreen label="Loading registration" />}>
            <RegisterForm />
        </Suspense>
    );
}