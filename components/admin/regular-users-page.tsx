"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type RegularUser } from "@/lib/api";
import {
    CUSTOMER_PERMISSION_GROUPS,
    PERM,
} from "@/lib/permissions/catalog";
import { PermissionGate } from "@/components/permission-gate";
import { useFormatters } from "@/contexts/format-context";
import { ImageField } from "@/components/file-picker";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "../ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";
type UserForm = { name: string; email: string; phoneNumber: string; password: string; profilePicture: string; active: boolean; emailVerified: boolean; permissions: string[] };
const EMPTY_FORM: UserForm = { name: "", email: "", phoneNumber: "", password: "", profilePicture: "", active: true, emailVerified: false, permissions: [] };

export function RegularUsersPage() {
    const { date } = useFormatters();
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
        setForm({ name: user.name, email: user.email, phoneNumber: user.phoneNumber ?? "", password: "", profilePicture: user.profilePicture ?? "", active: user.active, emailVerified: Boolean(user.emailVerifiedAt), permissions: user.permissions.filter((permission) => permission !== PERM.ADMIN) });
        setOpen(true);
    };

    const save = async () => {
        if (!form.name.trim() || !form.email.trim() || (!editing && form.password.length < 6)) return;
        if (form.phoneNumber && !isValidPhoneNumber(form.phoneNumber)) {
            toast.error("Please enter a valid phone number.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim() || null,
                profilePicture: form.profilePicture || null,
                active: form.active,
                emailVerified: form.emailVerified,
                permissions: form.permissions,
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
                <PermissionGate required={[PERM.USERS_CREATE, PERM.USERS_PERMISSIONS]} mode="hide">
                    <Button className="rounded-none" onClick={openNew}><Plus /> Add user</Button>
                </PermissionGate>
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
                                <td className="p-3">{date(user.createdAt)}</td>
                                <td className="p-3">
                                    <div className="flex justify-end gap-1">
                                        <PermissionGate required={[PERM.USERS_UPDATE, PERM.USERS_PERMISSIONS]} mode="hide">
                                            <Button size="icon" variant="ghost" aria-label={`Edit ${user.name}`} onClick={() => openEdit(user)}><Pencil /></Button>
                                        </PermissionGate>
                                        <PermissionGate required={PERM.USERS_DEACTIVATE} mode="hide">
                                            <Button size="icon" variant="ghost" aria-label={`Delete ${user.name}`} onClick={() => void remove(user)}><Trash2 /></Button>
                                        </PermissionGate>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PermissionGate
                required={editing ? [PERM.USERS_UPDATE, PERM.USERS_PERMISSIONS] : [PERM.USERS_CREATE, PERM.USERS_PERMISSIONS]}
            >
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-2xl">
                        <DialogHeader className="shrink-0 border-b px-6 py-5">
                            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
                            <DialogDescription>Manage a regular account. Staff access is managed separately.</DialogDescription>
                        </DialogHeader>
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                            <div className="space-y-1.5"><Label>Profile photo</Label><ImageField value={form.profilePicture} onChange={(profilePicture) => setForm((current) => ({ ...current, profilePicture }))} /></div>
                            <div className="space-y-1.5"><Label htmlFor="regular-user-name">Full name</Label><Input id="regular-user-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></div>
                            <div className="space-y-1.5"><Label htmlFor="regular-user-email">Email</Label><Input id="regular-user-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></div>
                            <div className="space-y-1.5"><Label htmlFor="regular-user-phone">Phone number (optional)</Label>

                                <PhoneInput
                                    id="phone"
                                    name="phone"
                                    international
                                    defaultCountry="RW"
                                    countryCallingCodeEditable={false}
                                    autoComplete="tel"
                                    placeholder="Enter phone number"

                                    value={form.phoneNumber}
                                    onChange={(value) => setForm((current) => ({ ...current, phoneNumber: value }))}
                                />
                            </div>
                            <div className="space-y-1.5"><Label htmlFor="regular-user-password">{editing ? "New password (optional)" : "Password (minimum 6 characters)"}</Label><Input id="regular-user-password" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} /></div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center justify-between border p-3"><Label htmlFor="regular-user-active">Account {form.active ? "active" : "disabled"}</Label><Switch id="regular-user-active" checked={form.active} onCheckedChange={(active) => setForm((current) => ({ ...current, active }))} /></div>
                                <div className="flex items-center justify-between border p-3"><Label htmlFor="regular-user-email-verified">Email {form.emailVerified ? "verified" : "unverified"}</Label><Switch id="regular-user-email-verified" checked={form.emailVerified} onCheckedChange={(emailVerified) => setForm((current) => ({ ...current, emailVerified }))} /></div>
                            </div>
                            <PermissionGate required={PERM.USERS_PERMISSIONS}>
                                <section className="space-y-3 border-t pt-4">
                                    <div>
                                        <h3 className="font-semibold">User permissions</h3>
                                        <p className="text-xs text-muted-foreground">
                                            These customer permissions are separate from staff and administrator access.
                                        </p>
                                    </div>
                                    <div className="max-h-[45vh] space-y-4 overflow-y-auto border p-3">
                                        {CUSTOMER_PERMISSION_GROUPS.map((group) => {
                                            return (
                                                <fieldset key={group.group} className="space-y-2">
                                                    <legend className="text-sm font-semibold">{group.group}</legend>
                                                    {group.items.map((permission) => (
                                                        <label key={permission.code} className="flex items-start gap-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={form.permissions.includes(permission.code)}
                                                                onChange={(event) =>
                                                                    setForm((current) => ({
                                                                        ...current,
                                                                        permissions: event.target.checked
                                                                            ? [...current.permissions, permission.code]
                                                                            : current.permissions.filter((code) => code !== permission.code),
                                                                    }))
                                                                }
                                                                className="mt-1 accent-primary"
                                                            />
                                                            <span>
                                                                <span className="block">{permission.label}</span>
                                                                <span className="block text-xs text-muted-foreground">{permission.description}</span>
                                                            </span>
                                                        </label>
                                                    ))}
                                                </fieldset>
                                            );
                                        })}
                                    </div>
                                </section>
                            </PermissionGate>
                            {editing?.lastLogin && <p className="text-xs text-muted-foreground">Last login: {date(editing.lastLogin)}</p>}
                        </div>
                        <DialogFooter className="shrink-0 border-t px-6 py-4">
                            <Button variant="outline" className="rounded-none" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button className="rounded-none" disabled={saving || !form.name.trim() || !form.email.trim() || (!editing && form.password.length < 6)} onClick={() => void save()}>
                                {saving && <Loader2 className="animate-spin" />}{editing ? "Save changes" : "Create user"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PermissionGate>
        </div>
    );
}