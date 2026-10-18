"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/app/i18n/routing";
import apiClient from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api";
import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "code" | "password";
const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

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

    const requestCode = (e?: FormEvent) => {
        e?.preventDefault();
        return run(async () => {
            await apiClient.post("/api/auth/forgot-password", { email: email.trim() });
            setCooldown(RESEND_SECONDS);
            setStep("code");
        }, "Could not send the code. Please try again.");
    };

    const verifyCode = (e: FormEvent) => {
        e.preventDefault();
        return run(async () => {
            await apiClient.post("/api/auth/verify-otp", { email: email.trim(), otp: code.trim() });
            setStep("password");
        }, "Invalid or expired code.");
    };

    const resetPassword = (e: FormEvent) => {
        e.preventDefault();
        if (password.length < 8) return setError("Password must be at least 8 characters.");
        if (password !== confirm) return setError("Passwords don't match.");
        return run(async () => {
            await apiClient.post("/api/auth/reset-password", {
                email: email.trim(),
                otp: code.trim(),
                newPassword: password,
                confirmPassword: confirm,
            });
            toast.success("Password reset. Please sign in.");
            router.replace("/login");
        }, "Could not reset your password. Request a new code.");
    };

    const back = (
        <Link href="/login" className="font-semibold text-primary hover:underline">
            Back to sign in
        </Link>
    );

    if (step === "email") {
        return (
            <>
                <div className="max-w-7xl mx-auto text-center">
                    <div>
                        <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
                            <span className="w-8 h-px bg-primary" />
                            Mountain Ceramics Company
                            <span className="w-8 h-px bg-primary" />
                        </span>
                        <h1 className="font-bold text-4xl md:text-5xl  leading-tight">
                            Forgot your password?
                        </h1>
                        <p className=" text-lg max-w-2xl mx-auto">
                            Enter your email and we'll send a 6-digit code
                        </p>
                    </div>

                </div>
                <div className="flex  py-12 items-center justify-center px-4 ">
                    <div className="w-full max-w-md  border border-border bg-background p-8 shadow-xl">
                        <form onSubmit={requestCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" autoComplete="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <FormError message={error} />
                            <Button type="submit" className="w-full" disabled={busy || !email}>
                                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send code
                            </Button>
                        </form>
                        {back}
                    </div>
                </div>
            </>
        );
    }

    if (step === "code") {
        return (
            <div className="max-w-7xl mx-auto text-center">
                <div>
                    <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
                        <span className="w-8 h-px bg-primary" />
                        Mountain Ceramics Company
                        <span className="w-8 h-px bg-primary" />
                    </span>
                    <h1 className="font-bold text-4xl md:text-5xl  leading-tight">
                        `If ${email} has an account, a code is on its way. It expires in 15 minutes.`
                    </h1>
                    <p className=" text-lg max-w-2xl mx-auto">
                        Sign in to your account
                    </p>
                </div>


                <div className="flex  py-12 items-center justify-center px-4 ">
                    <div className="w-full max-w-md  border border-border bg-background p-8 shadow-xl">
                        <form onSubmit={verifyCode} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">6-digit code</Label>
                                <Input
                                    id="code"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    autoFocus
                                    required
                                    maxLength={6}
                                    pattern="\d{6}"
                                    className="text-center text-2xl tracking-[0.5em]"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                />
                            </div>
                            <FormError message={error} />
                            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
                                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify code
                            </Button>
                            <div className="flex justify-between text-sm">
                                <Button type="button" className="text-muted-foreground hover:underline" onClick={() => { setStep("email"); setCode(""); setError(""); }}>
                                    Change email
                                </Button>
                                <Button
                                    type="button"
                                    disabled={cooldown > 0 || busy}
                                    className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                                    onClick={() => void requestCode()}
                                >
                                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                                </Button>
                            </div>
                        </form>
                        {back}
                    </div>
                </div>

            </div>
        );
    }

    return (
        <AuthCard title="Choose a new password" subtitle="Use at least 8 characters" footer={back}>
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
                <Button type="submit" className="w-full" disabled={busy}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset password
                </Button>
            </form>
        </AuthCard>
    );
}