"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Link, useRouter } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { apiErrorMessage } from "@/lib/api";
import { safeNext } from "@/lib/auth/safe-next";
import { LuxuryLoading } from "@/components/luxury-loading";
import { FormError } from "@/components/auth/form-error";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
    const { login, isAuthenticated, isInitializing } = useAuth();
    const router = useRouter();
    const next = safeNext(useSearchParams().get("next"));

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [challenge, setChallenge] = useState("");
    const [method, setMethod] = useState<"email" | "authenticator" | null>(null);
    const [code, setCode] = useState("");

    // Already signed in (or session restored on load): skip the form
    useEffect(() => {
        if (!isInitializing && isAuthenticated && !submitting) router.replace(next);
    }, [isInitializing, isAuthenticated, submitting, next, router]);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setNotice("");
        setSubmitting(true);
        try {
            const result = await login(
                identifier.trim(),
                password,
                next,
                challenge ? { challenge, code: code.trim() } : undefined,
            );
            if ("accountDisabled" in result) {
                setSubmitting(false);
                router.replace(`/account-disabled?next=${encodeURIComponent(next)}`);
                return;
            }
            if ("emailVerificationRequired" in result) {
                setSubmitting(false);
                router.replace(`/verify-email?sent=1&next=${encodeURIComponent(next)}`);
                return;
            }
            if ("twoFactorRequired" in result && result.twoFactorRequired) {
                setChallenge(result.challenge);
                setMethod(result.method);
                setCode("");
                setNotice(result.message);
                setSubmitting(false);
            }
        } catch (err) {
            setError(apiErrorMessage(err, "Sign in failed. Please try again."));
            setSubmitting(false);
        }
    }

    async function resendCode() {
        setError("");
        setSubmitting(true);
        try {
            const result = await login(identifier.trim(), password, next);
            if ("accountDisabled" in result) {
                setSubmitting(false);
                router.replace(`/account-disabled?next=${encodeURIComponent(next)}`);
                return;
            }
            if ("emailVerificationRequired" in result) {
                setSubmitting(false);
                router.replace(`/verify-email?sent=1&next=${encodeURIComponent(next)}`);
                return;
            }
            if ("twoFactorRequired" in result && result.twoFactorRequired) {
                setChallenge(result.challenge);
                setMethod(result.method);
                setNotice(result.message);
            }
        } catch (err) {
            setError(apiErrorMessage(err, "Could not send another code."));
        } finally {
            setSubmitting(false);
        }
    }

    return (<>
        <div className="max-w-7xl mx-auto text-center">
            <div>
                <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
                    <span className="w-8 h-px bg-primary" />
                    Mountain Ceramics Company
                    <span className="w-8 h-px bg-primary" />
                </span>
                <h1 className="font-bold text-4xl md:text-5xl leading-tight">
                    {challenge ? "Verify it’s you" : "Welcome back"}
                </h1>
                <p className=" text-lg max-w-2xl mx-auto">
                    {challenge
                        ? method === "email"
                            ? "Enter the code sent to your email"
                            : "Enter the code from your authenticator app"
                        : "Sign in to your account"}
                </p>
            </div>

        </div>
        <div className="flex  py-12 items-center justify-center px-4 ">
            <div className="w-full max-w-md  border border-border bg-background p-8 shadow-xl">

                <form onSubmit={onSubmit} className="space-y-4" noValidate>
                    {!challenge ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="identifier">Email or phone number</Label>
                                <Input
                                    id="identifier"
                                    autoComplete="username"
                                    autoFocus
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                                <PasswordInput
                                    id="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="two-factor-code">6-digit verification code</Label>
                            <OtpInput
                                id="two-factor-code"
                                autoFocus
                                value={code}
                                onChange={setCode}
                            />
                        </div>
                    )}

                    <FormError message={error} />
                    {notice && <p className="text-sm text-muted-foreground" aria-live="polite">{notice}</p>}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={
                            submitting ||
                            (!challenge && (!identifier || !password)) ||
                            (!!challenge && code.length !== 6)
                        }
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitting ? "Please wait…" : challenge ? "Verify and sign in" : "Sign in"}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                        View our{" "}
                        <Link href="/legal/terms-and-conditions" className="underline underline-offset-4">Terms and Conditions</Link>
                        {", "}
                        <Link href="/legal/terms-of-service" className="underline underline-offset-4">Terms of Service</Link>
                        {", and "}
                        <Link href="/legal/privacy-policy" className="underline underline-offset-4">Privacy Policy</Link>.
                    </p>
                    {challenge && method === "email" && (
                        <Button type="button" variant="outline" className="w-full" disabled={submitting} onClick={resendCode}>
                            Send another code
                        </Button>
                    )}
                </form>
                <div className="py-6 flex items-center justify-center">
                    New here?{" "}
                    <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-primary hover:underline">
                        Create an account
                    </Link>
                </div>
                {challenge && (
                    <Button
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={() => { setChallenge(""); setMethod(null); setCode(""); setNotice(""); }}
                    >
                        Back to password sign in
                    </Button>
                )}
            </div>

        </div>

    </>
    );
}

// useSearchParams needs a Suspense boundary or `next build` fails
export default function LoginPage() {
    return (
        <Suspense fallback={<LuxuryLoading fullScreen label="Loading sign in" />}>
            <LoginForm />
        </Suspense>
    );
}