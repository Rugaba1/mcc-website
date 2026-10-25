"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/app/i18n/routing";
import { api, apiErrorMessage } from "@/lib/api";
import { AuthCard } from "@/components/auth/auth-card";
import { LuxuryLoading } from "@/components/luxury-loading";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "sent" | "password";

function ForgotPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tokenFromUrl = searchParams.get("token") ?? "";
    const [step, setStep] = useState<Step>(tokenFromUrl ? "password" : "email");
    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState(tokenFromUrl);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!tokenFromUrl) return;
        setResetToken(tokenFromUrl);
        setStep("password");
        window.history.replaceState(window.history.state, "", window.location.pathname);
    }, [tokenFromUrl]);

    async function run(action: () => Promise<void>, fallback: string) {
        setError("");
        setBusy(true);
        try {
            await action();
        } catch (err) {
            setError(apiErrorMessage(err, fallback));
        } finally {
            setBusy(false);
        }
    }

    const requestResetLink = (e: FormEvent) => {
        e.preventDefault();
        return run(async () => {
            const data = await api.requestPasswordReset(email.trim());
            setStep("sent");
            toast.success(data.message);
        }, "Could not send the reset link. Please try again.");
    };

    const resetPassword = (e: FormEvent) => {
        e.preventDefault();
        if (password.length < 8) return setError("Password must be at least 8 characters.");
        if (password !== confirm) return setError("Passwords don't match.");
        if (!resetToken) return setError("This reset link is missing or invalid.");
        return run(async () => {
            await api.resetPassword({
                token: resetToken,
                newPassword: password,
                confirmPassword: confirm,
            });
            setResetToken("");
            toast.success("Password reset. Please sign in.");
            router.replace("/login");
        }, "Could not reset your password. Request a new link.");
    };

    const back = (
        <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
        </Link>
    );

    if (step === "sent") {
        return (
            <AuthCard
                title="Check your email"
                subtitle={`If an account with ${email} exists, a password reset link has been sent. It expires in 30 minutes.`}
                footer={back}
            >
                <Button type="button" variant="outline" onClick={() => setStep("email")}>
                    Use a different email
                </Button>
            </AuthCard>
        );
    }

    if (step === "password") {
        return (
            <AuthCard
                title="Choose a new password"
                subtitle="Use at least 8 characters. Your reset link expires in 30 minutes."
                footer={back}
            >
                <form onSubmit={resetPassword} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New password</Label>
                        <PasswordInput id="password" autoComplete="new-password" autoFocus required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm new password</Label>
                        <PasswordInput id="confirm" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                    <FormError message={error} />
                    <Button type="submit" className="w-full" disabled={busy || !resetToken}>
                        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reset password
                    </Button>
                </form>
            </AuthCard>
        );
    }

    return (
        <>
            <div className="mx-auto max-w-7xl text-center">
                <span className="mb-4 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em]">
                    <span className="h-px w-8 bg-primary" />
                    Mountain Ceramics Company
                    <span className="h-px w-8 bg-primary" />
                </span>
                <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                    Forgot your password?
                </h1>
                <p className="mx-auto max-w-2xl text-lg">
                    Enter your email and we&apos;ll send you a secure reset link.
                </p>
            </div>
            <div className="flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md border border-border bg-background p-8 shadow-xl">
                    <form onSubmit={requestResetLink} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <FormError message={error} />
                        <Button type="submit" className="w-full" disabled={busy || !email}>
                            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send reset link
                        </Button>
                    </form>
                    {back}
                </div>
            </div>
        </>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<LuxuryLoading fullScreen label="Loading password recovery" />}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
