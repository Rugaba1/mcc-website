"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { OtpInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";

type TwoFactorMethod = "email" | "authenticator";
type TwoFactorStatus = {
    enabled: boolean;
    method: TwoFactorMethod | null;
    required: boolean;
};
type TwoFactorSetup = {
    method: TwoFactorMethod;
    challenge: string;
    message: string;
    secret?: string;
    authenticatorUri?: string;
};

export default function SettingsPage() {
    const [profile, setProfile] = useState({ firstName: "", lastName: "", phoneNumber: "", email: "" });
    const [saving, setSaving] = useState(false);
    const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
    const [changing, setChanging] = useState(false);
    const [delOpen, setDelOpen] = useState(false);
    const [delPw, setDelPw] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null);
    const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>("email");
    const [twoFactorPassword, setTwoFactorPassword] = useState("");
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
    const [twoFactorBusy, setTwoFactorBusy] = useState(false);
    const [secretCopied, setSecretCopied] = useState(false);
    useEffect(() => {
        api.getMe().then((m) =>
            setProfile({ firstName: m.firstName, lastName: m.lastName ?? "", phoneNumber: m.phoneNumber ?? "", email: m.email }),
        ).catch(() => toast.error("Could not load your profile"));
    }, []);
    useEffect(() => {
        api.getTwoFactorStatus().then((data) => {
            setTwoFactor(data);
            if (data.method) setTwoFactorMethod(data.method);
        }).catch(() => toast.error("Could not load two-factor settings"));
    }, []);

    async function saveProfile(e: FormEvent) {
        e.preventDefault();
        if (profile.phoneNumber && !isValidPhoneNumber(profile.phoneNumber)) {
            toast.error("Please enter a valid phone number.");
            return;
        }
        setSaving(true);
        try {
            await api.updateMe({ firstName: profile.firstName, lastName: profile.lastName, phoneNumber: profile.phoneNumber });
            toast.success("Profile updated");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Update failed"));
        } finally { setSaving(false); }
    }
    async function deleteAccount() {
        if (!delPw) return toast.error("Enter your password to confirm");
        setDeleting(true);
        try {
            await api.deleteMyAccount(delPw);
            toast.success("Your account has been deleted");
            window.location.href = "/";
        } catch (err) {
            toast.error(apiErrorMessage(err, "Could not delete account"));
            setDeleting(false);
        }
    }
    async function savePassword(e: FormEvent) {
        e.preventDefault();
        if (pw.next.length < 8) return toast.error("New password must be at least 8 characters");
        if (pw.next !== pw.confirm) return toast.error("Passwords don't match");
        setChanging(true);
        try {
            await api.changePassword({ currentPassword: pw.current, newPassword: pw.next });
            setPw({ current: "", next: "", confirm: "" });
            toast.success("Password changed");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Could not change password"));
        } finally { setChanging(false); }
    }

    async function startTwoFactorSetup() {
        if (!twoFactorPassword) return toast.error("Enter your current password");
        setTwoFactorBusy(true);
        try {
            const data = await api.setupTwoFactor({
                method: twoFactorMethod,
                currentPassword: twoFactorPassword,
            });
            setTwoFactorSetup(data);
            setTwoFactorCode("");
            toast.success(data.message);
        } catch (err) {
            toast.error(apiErrorMessage(err, "Could not start two-factor setup"));
        } finally {
            setTwoFactorBusy(false);
        }
    }

    async function confirmTwoFactor(e: FormEvent) {
        e.preventDefault();
        if (!twoFactorSetup || twoFactorCode.length !== 6) return;
        setTwoFactorBusy(true);
        try {
            const data = await api.confirmTwoFactor({
                method: twoFactorSetup.method,
                challenge: twoFactorSetup.challenge,
                code: twoFactorCode,
            });
            setTwoFactor({
                enabled: data.enabled,
                method: data.method,
                required: twoFactor?.required ?? false,
            });
            setTwoFactorSetup(null);
            setTwoFactorPassword("");
            setTwoFactorCode("");
            toast.success("Two-factor authentication is enabled");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Invalid or expired verification code"));
        } finally {
            setTwoFactorBusy(false);
        }
    }

    async function disableTwoFactor() {
        if (!twoFactorPassword) return toast.error("Enter your current password");
        setTwoFactorBusy(true);
        try {
            await api.disableTwoFactor(twoFactorPassword);
            setTwoFactor({ enabled: false, method: null, required: false });
            setTwoFactorPassword("");
            setTwoFactorSetup(null);
            toast.success("Two-factor authentication disabled");
        } catch (err) {
            toast.error(apiErrorMessage(err, "Could not disable two-factor authentication"));
        } finally {
            setTwoFactorBusy(false);
        }
    }

    return (
        <div className="flex w-full items-center justify-center">
            <div className=" w-full space-y-10 flex flex-col ">
                <h1 className="text-3xl font-bold">Settings</h1>

                <form onSubmit={saveProfile} className="space-y-4  border border-border bg-background p-6">
                    <h2 className="font-semibold">Profile</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="fn">First name</Label><Input id="fn" required value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="ln">Last name</Label><Input id="ln" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="em">Email</Label><Input id="em" value={profile.email} disabled /></div>
                    <div className="space-y-2"><Label htmlFor="ph">Phone</Label>
                        <PhoneInput
                            id="phone"
                            name="phone"
                            international
                            defaultCountry="RW"
                            countryCallingCodeEditable={false}
                            autoComplete="tel"
                            placeholder="Enter phone number"

                            value={profile.phoneNumber}
                            onChange={(value) => setProfile({ ...profile, phoneNumber: value })}
                        />

                    </div>
                    <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
                </form>

                <form onSubmit={savePassword} className="space-y-4  border border-border bg-background p-6">
                    <h2 className="font-semibold">Change password</h2>
                    <div className="space-y-2"><Label htmlFor="cp">Current password</Label><PasswordInput id="cp" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="np">New password</Label><PasswordInput id="np" autoComplete="new-password" required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="cf">Confirm new password</Label><PasswordInput id="cf" autoComplete="new-password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
                    <Button type="submit" disabled={changing}>{changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Change password</Button>
                </form>

                <section className="space-y-4 border border-border bg-background p-6" aria-labelledby="two-factor-heading">
                    <div>
                        <h2 id="two-factor-heading" className="font-semibold">Two-factor authentication</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {twoFactor?.required
                                ? "Required for staff accounts. You can choose email codes or an authenticator app."
                                : "Add a second verification step to protect your account."}
                        </p>
                    </div>
                    {twoFactor ? (
                        <p role="status">
                            {twoFactor.enabled
                                ? `Enabled with ${twoFactor.method === "email" ? "email codes" : "an authenticator app"}.`
                                : "Not enabled."}
                        </p>
                    ) : (
                        <p role="status">Loading two-factor settings…</p>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="two-factor-current-password">
                            Current password
                        </Label>
                        <PasswordInput
                            id="two-factor-current-password"
                            autoComplete="current-password"
                            value={twoFactorPassword}
                            onChange={(e) => setTwoFactorPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2" aria-label="Two-factor method">
                        <Button
                            type="button"
                            variant={twoFactorMethod === "email" ? "default" : "outline"}
                            aria-pressed={twoFactorMethod === "email"}
                            onClick={() => { setTwoFactorMethod("email"); setTwoFactorSetup(null); }}
                        >
                            Email code
                        </Button>
                        <Button
                            type="button"
                            variant={twoFactorMethod === "authenticator" ? "default" : "outline"}
                            aria-pressed={twoFactorMethod === "authenticator"}
                            onClick={() => { setTwoFactorMethod("authenticator"); setTwoFactorSetup(null); }}
                        >
                            Authenticator app
                        </Button>
                    </div>
                    {twoFactorSetup ? (
                        <form onSubmit={confirmTwoFactor} className="space-y-4">
                            {twoFactorSetup.secret && twoFactorSetup.authenticatorUri && (
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        Scan this QR code with your authenticator app. If you cannot scan it, enter the setup key manually:
                                    </p>
                                    <div className="inline-flex rounded-md border border-border bg-card p-3">
                                        <QRCodeSVG
                                            value={twoFactorSetup.authenticatorUri}
                                            size={224}
                                            level="M"
                                            title="Authenticator app setup QR code"
                                        />
                                    </div>
                                    <div className="flex min-w-0 items-start gap-2">
                                        <p className="min-w-0 flex-1 break-all rounded-md bg-muted p-3 font-mono text-sm" aria-label="Authenticator secret">
                                            {twoFactorSetup.secret}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            aria-label={secretCopied ? "Setup key copied" : "Copy setup key"}
                                            title={secretCopied ? "Copied" : "Copy setup key"}
                                            onClick={async () => {
                                                try {
                                                    await navigator.clipboard.writeText(twoFactorSetup.secret!);
                                                    setSecretCopied(true);
                                                    toast.success("Authenticator setup key copied.");
                                                    window.setTimeout(() => setSecretCopied(false), 2000);
                                                } catch {
                                                    toast.error("Could not copy the setup key. Please copy it manually.");
                                                }
                                            }}
                                        >
                                            {secretCopied ? <Check /> : <Copy />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="two-factor-confirm-code">6-digit verification code</Label>
                                <OtpInput
                                    id="two-factor-confirm-code"
                                    value={twoFactorCode}
                                    onChange={setTwoFactorCode}
                                />
                            </div>
                            <Button type="submit" disabled={twoFactorBusy || twoFactorCode.length !== 6}>
                                {twoFactorBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm setup
                            </Button>
                        </form>
                    ) : (
                        <Button
                            type="button"
                            disabled={twoFactorBusy || !twoFactor}
                            onClick={startTwoFactorSetup}
                        >
                            {twoFactorBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {twoFactor?.enabled ? "Change two-factor method" : "Set up two-factor"}
                        </Button>
                    )}
                    {twoFactor?.enabled && !twoFactor.required && (
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={twoFactorBusy || !!twoFactorSetup}
                            onClick={disableTwoFactor}
                        >
                            Disable two-factor authentication
                        </Button>
                    )}
                </section>

                <div className="space-y-4 border border-destructive/40 bg-background p-6">
                    <h2 className="font-semibold text-destructive">Delete account</h2>
                    <p className="text-sm text-muted-foreground">
                        Permanently removes your profile, addresses, cart, wishlist, reviews and saved designs.
                        Completed orders are kept for our accounting records but are no longer linked to you.
                        This cannot be undone.
                    </p>

                    <AlertDialog open={delOpen} onOpenChange={(o) => { setDelOpen(o); if (!o) setDelPw(""); }}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Delete my account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Enter your password to confirm. You will be signed out immediately.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="dp">Password</Label>
                                <PasswordInput id="dp" autoComplete="current-password" value={delPw} onChange={(e) => setDelPw(e.target.value)} />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={deleting || !delPw}
                                    onClick={(e) => { e.preventDefault(); deleteAccount(); }}
                                >
                                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete permanently
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
}