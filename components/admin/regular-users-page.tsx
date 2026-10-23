"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type RegularUser } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { ImageField } from "@/components/file-picker";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type UserForm = { name: string; email: string; phoneNumber: string; password: string; profilePicture: string; active: boolean; emailVerified: boolean };
const EMPTY_FORM: UserForm = { name: "", email: "", phoneNumber: "", password: "", profilePicture: "", active: true, emailVerified: false };

export function RegularUsersPage() {
    const [users, setUsers] = useState<RegularUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editing, setEditing] = useState<RegularUser | null>(null);
    const [form, setForm] = useState<UserForm>(EMPTY_FORM);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            setUsers(await api.getUsers());
        } catch (error) {
            toast.error(apiErrorMessage(error, "Failed to load users"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const openNew = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setOpen(true);
    };

    const openEdit = (user: RegularUser) => {
        setEditing(user);
        setForm({ name: user.name, email: user.email, phoneNumber: user.phoneNumber ?? "", password: "", profilePicture: user.profilePicture ?? "", active: user.active, emailVerified: Boolean(user.emailVerifiedAt) });
        setOpen(true);
    };

    const save = async () => {
        if (!form.name.trim() || !form.email.trim() || (!editing && form.password.length < 6)) return;
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim() || null,
                profilePicture: form.profilePicture || null,
                active: form.active,
                emailVerified: form.emailVerified,
                ...(form.password ? { password: form.password } : {}),
            };
            if (editing) await api.updateUser(editing.id, payload);
            else await api.createUser({ ...payload, password: form.password });
            toast.success(editing ? "User updated" : "User created");
            setOpen(false);
            await load();
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not save user"));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (user: RegularUser) => {
        if (!confirm(`Delete ${user.name} (${user.email})?`)) return;
        try {
            await api.deleteUser(user.id);
            toast.success("User deleted");
            await load();
        } catch (error) {
            toast.error(apiErrorMessage(error, "Could not delete user"));
        }
    };

    const query = search.trim().toLowerCase();
    const visible = users.filter((user) =>
        !query || `${user.name} ${user.email}`.toLowerCase().includes(query),
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Users</h1>
                    <p className="text-sm text-muted-foreground">Manage regular accounts. Customers with orders are listed separately.</p>
                </div>
                <Button className="rounded-none" onClick={openNew}><Plus /> Add user</Button>
            </div>

            <Input
                className="max-w-sm rounded-none"
                placeholder="Search name or email…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />

            <div className="overflow-x-auto border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="p-3">User</th>
                            <th className="p-3">Account</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Joined</th>
                            <th className="p-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto animate-spin" /></td></tr>}
                        {!loading && visible.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No user accounts found.</td></tr>}
                        {visible.map((user) => (
                            <tr key={user.id} className="border-t">
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <span className="flex size-10 items-center justify-center overflow-hidden rounded-full border bg-muted">
                                            {user.profilePicture ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={user.profilePicture} alt="" className="size-full object-cover" />
                                            ) : <UserRound className="size-5 text-muted-foreground" />}
                                        </span>
                                        <div><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}{user.phoneNumber ? ` · ${user.phoneNumber}` : ""}</p></div>
                                    </div>
                                </td>
                                <td className="p-3"><StatusBadge status={user.active ? "ACTIVE" : "DISABLED"} /></td>
                                <td className="p-3"><StatusBadge status={user.emailVerifiedAt ? "VERIFIED" : "UNVERIFIED"} /></td>
                                <td className="p-3">{fmtDate(user.createdAt)}</td>
                                <td className="p-3">
                                    <div className="flex justify-end gap-1">
                                        <Button size="icon" variant="ghost" aria-label={`Edit ${user.name}`} onClick={() => openEdit(user)}><Pencil /></Button>
                                        <Button size="icon" variant="ghost" aria-label={`Delete ${user.name}`} onClick={() => void remove(user)}><Trash2 /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="rounded-none sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
                        <DialogDescription>Manage a regular account. Staff access is managed separately.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5"><Label>Profile photo</Label><ImageField value={form.profilePicture} onChange={(profilePicture) => setForm((current) => ({ ...current, profilePicture }))} /></div>
                        <div className="space-y-1.5"><Label htmlFor="regular-user-name">Full name</Label><Input id="regular-user-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
                        <div className="space-y-1.5"><Label htmlFor="regular-user-email">Email</Label><Input id="regular-user-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></div>
                        <div className="space-y-1.5"><Label htmlFor="regular-user-phone">Phone number (optional)</Label><Input id="regular-user-phone" type="tel" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} /></div>
                        <div className="space-y-1.5"><Label htmlFor="regular-user-password">{editing ? "New password (optional)" : "Password (minimum 6 characters)"}</Label><Input id="regular-user-password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center justify-between border p-3"><Label htmlFor="regular-user-active">Account {form.active ? "active" : "disabled"}</Label><Switch id="regular-user-active" checked={form.active} onCheckedChange={(active) => setForm((current) => ({ ...current, active }))} /></div>
                            <div className="flex items-center justify-between border p-3"><Label htmlFor="regular-user-email-verified">Email {form.emailVerified ? "verified" : "unverified"}</Label><Switch id="regular-user-email-verified" checked={form.emailVerified} onCheckedChange={(emailVerified) => setForm((current) => ({ ...current, emailVerified }))} /></div>
                        </div>
                        {editing?.lastLogin && <p className="text-xs text-muted-foreground">Last login: {fmtDate(editing.lastLogin)}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-none" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button className="rounded-none" disabled={saving || !form.name.trim() || !form.email.trim() || (!editing && form.password.length < 6)} onClick={() => void save()}>
                            {saving && <Loader2 className="animate-spin" />}{editing ? "Save changes" : "Create user"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}