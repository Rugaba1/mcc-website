"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { useAuth } from "@/contexts/auth-context";
import apiClient from "@/lib/api-client";
import { apiErrorMessage } from "@/lib/api";
import { AuthCard } from "@/components/auth/auth-card";
import { FormError } from "@/components/auth/form-error";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
    const { login } = useAuth();
    const [form, setForm] = useState({
        firstName: "", lastName: "", email: "", phoneNumber: "", password: "", confirm: "",
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        if (form.password.length < 8) return setError("Password must be at least 8 characters.");
        if (form.password !== form.confirm) return setError("Passwords don't match.");

        setSubmitting(true);
        try {
            await apiClient.post("/api/auth/register", {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim() || undefined,
                password: form.password,
            });
            // Account exists now: sign in and go to /account
            await login(form.email.trim(), form.password);
        } catch (err) {
            setError(apiErrorMessage(err, "Could not create your account."));
            setSubmitting(false);
        }
    }

    return (
        <AuthCard
            title="Create your account"
            subtitle="Track orders and save your favourite tiles"
            footer={
                <>
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Sign in
                    </Link>
                </>
            }
        >
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
                    <Input id="phone" type="tel" autoComplete="tel" maxLength={20} placeholder="+250 7XX XXX XXX" value={form.phoneNumber} onChange={set("phoneNumber")} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <PasswordInput id="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" value={form.password} onChange={set("password")} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <PasswordInput id="confirm" autoComplete="new-password" required value={form.confirm} onChange={set("confirm")} />
                </div>

                <FormError message={error} />

                <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitting ? "Creating account…" : "Create account"}
                </Button>
            </form>
        </AuthCard>
    );
}