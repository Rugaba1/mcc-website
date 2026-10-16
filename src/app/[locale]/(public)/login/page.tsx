"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Link, useRouter } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import { apiErrorMessage } from "@/lib/api";
import { safeNext } from "@/lib/auth/safe-next";
import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/auth/form-error";
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
    const [submitting, setSubmitting] = useState(false);

    // Already signed in (or session restored on load): skip the form
    useEffect(() => {
        if (!isInitializing && isAuthenticated && !submitting) router.replace(next);
    }, [isInitializing, isAuthenticated, submitting, next, router]);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await login(identifier.trim(), password, next);
        } catch (err) {
            setError(apiErrorMessage(err, "Sign in failed. Please try again."));
            setSubmitting(false);
        }
    }

    return (
        <AuthCard
            title="Welcome back"
            subtitle="Sign in to your account"
            footer={
                <>
                    New here?{" "}
                    <Link href="/register" className="font-semibold text-primary hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
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

                <FormError message={error} />

                <Button type="submit" className="w-full" disabled={submitting || !identifier || !password}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitting ? "Signing in…" : "Sign in"}
                </Button>
            </form>
        </AuthCard>
    );
}

// useSearchParams needs a Suspense boundary or `next build` fails
export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}