"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
export default function SettingsPage() {
    const [profile, setProfile] = useState({ firstName: "", lastName: "", phoneNumber: "", email: "" });
    const [saving, setSaving] = useState(false);
    const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
    const [changing, setChanging] = useState(false);
    const [delOpen, setDelOpen] = useState(false);
    const [delPw, setDelPw] = useState("");
    const [deleting, setDeleting] = useState(false);
    useEffect(() => {
        api.getMe().then((m) =>
            setProfile({ firstName: m.firstName, lastName: m.lastName ?? "", phoneNumber: m.phoneNumber ?? "", email: m.email }),
        ).catch(() => toast.error("Could not load your profile"));
    }, []);

    async function saveProfile(e: FormEvent) {
        e.preventDefault();
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
                    <div className="space-y-2"><Label htmlFor="ph">Phone</Label><Input id="ph" type="tel" value={profile.phoneNumber} onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })} /></div>
                    <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
                </form>

                <form onSubmit={savePassword} className="space-y-4  border border-border bg-background p-6">
                    <h2 className="font-semibold">Change password</h2>
                    <div className="space-y-2"><Label htmlFor="cp">Current password</Label><PasswordInput id="cp" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="np">New password</Label><PasswordInput id="np" autoComplete="new-password" required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="cf">Confirm new password</Label><PasswordInput id="cf" autoComplete="new-password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
                    <Button type="submit" disabled={changing}>{changing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Change password</Button>
                </form>
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