"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "@/app/i18n/routing";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Star, Trash2, UserRound } from "lucide-react";

import { api, apiErrorMessage, type AdminUser } from "@/lib/api";
import { useFormatters } from "@/contexts/format-context";
import {
  DEFAULT_STAFF_PERMISSIONS,
  PERMISSION_GROUPS,
  PERM,
  ROLE_PRESETS,
} from "@/lib/permissions/catalog";
import { PermissionGate } from "@/components/permission-gate";
import { ImageField } from "@/components/file-picker";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RegularUsersPage } from "@/components/admin/regular-users-page";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Form = {
  name: string;
  email: string;
  password: string;
  active: boolean;
  profilePicture: string;
  jobTitle: string;
  bio: string;
  showOnHomepage: boolean;
  displayOrder: number;
  permissions: string[];
};

const EMPTY: Form = {
  name: "", email: "", password: "", active: true,
  profilePicture: "", jobTitle: "", bio: "",
  showOnHomepage: false, displayOrder: 0,
  permissions: [...DEFAULT_STAFF_PERMISSIONS],
};

const toForm = (u: AdminUser): Form => ({
  name: u.name, email: u.email, password: "", active: u.active,
  profilePicture: u.profilePicture ?? "", jobTitle: u.jobTitle ?? "", bio: u.bio ?? "",
  showOnHomepage: u.showOnHomepage, displayOrder: u.displayOrder, permissions: u.permissions,
});

function Avatar({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <UserRound className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}

function Field({
  id, label, error, hint, children,
}: { id?: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
function StaffManagementPage() {
  const { date } = useFormatters();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await api.getStaff());
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(EMPTY); setErrors({}); setOpen(true); };
  const openEdit = (u: AdminUser) => { setEditing(u); setForm(toForm(u)); setErrors({}); setOpen(true); };

  const togglePerm = (code: string) =>
    set("permissions", form.permissions.includes(code)
      ? form.permissions.filter((c) => c !== code)
      : [...form.permissions, code]);

  const validate = () => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!EMAIL.test(form.email)) e.email = "Enter a valid email";
    if (!editing && form.password.length < 6) e.password = "At least 6 characters";
    if (editing && form.password && form.password.length < 6) e.password = "At least 6 characters";
    if (form.showOnHomepage && !form.jobTitle.trim()) e.jobTitle = "Required to show on the homepage";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        active: form.active,
        profilePicture: form.profilePicture || null,
        jobTitle: form.jobTitle.trim() || null,
        bio: form.bio.trim() || null,
        showOnHomepage: form.showOnHomepage,
        displayOrder: Number(form.displayOrder) || 0,
        permissions: form.permissions,
        ...(form.password ? { password: form.password } : {}),
      };
      if (editing) await api.updateStaff(editing.id, payload);
      else await api.createStaff({ ...payload, password: form.password });
      toast.success(editing ? "User updated" : "User created");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (u: AdminUser) => {
    try {
      await api.updateStaff(u.id, { showOnHomepage: !u.showOnHomepage });
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const remove = async (u: AdminUser) => {
    if (!confirm(`${u.name} (${u.email}) will lose access. If they have placed orders, consider disabling the account instead.\n\nDelete this user?`)) return;
    try {
      await api.deleteStaff(u.id);
      toast.success("User deleted");
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const q = search.trim().toLowerCase();
  const visible = users.filter((u) => !q || `${u.name} ${u.email} ${u.jobTitle ?? ""}`.toLowerCase().includes(q));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Create staff accounts, manage access permissions, and control who appears in the homepage team section. Customers are managed separately.
          </p>
        </div>
        <PermissionGate
          required={[PERM.USERS_CREATE, PERM.USERS_PERMISSIONS]}
          mode="hide"
        >
          <Button className="rounded-none" onClick={openNew}><Plus /> Add staff</Button>
        </PermissionGate>
      </div>

      <Input className="max-w-sm rounded-none" placeholder="Search name, email or job title…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="overflow-x-auto border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Job title</th>
              <th className="p-3">Access</th>
              <th className="p-3">Homepage</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto animate-spin" /></td></tr>
            )}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No staff found.</td></tr>
            )}
            {visible.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.profilePicture} name={u.name} />
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">{u.jobTitle ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="p-3">
                  {u.permissions.includes(PERM.ADMIN)
                    ? <Badge className="rounded-none">Admin</Badge>
                    : <span className="text-muted-foreground">{u.permissions.length} permission{u.permissions.length === 1 ? "" : "s"}</span>}
                </td>
                <td className="p-3">
                  <PermissionGate
                    required={[PERM.USERS_UPDATE, PERM.USERS_PERMISSIONS]}
                    mode="hide"
                  >
                    <Button
                      size="sm"
                      variant={u.showOnHomepage ? "default" : "outline"}
                      className="rounded-none"
                      onClick={() => toggleFeatured(u)}
                      title="Show / hide on the homepage"
                    >
                      <Star className={u.showOnHomepage ? "fill-current" : ""} />
                      {u.showOnHomepage ? "Featured" : "Hidden"}
                    </Button>
                  </PermissionGate>
                </td>
                <td className="p-3"><StatusBadge status={u.active ? "ACTIVE" : "DISABLED"} /></td>
                <td className="p-3">{date(u.createdAt)}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <PermissionGate
                      required={[PERM.USERS_UPDATE, PERM.USERS_PERMISSIONS]}
                      mode="hide"
                    >
                      <Button size="icon" variant="ghost" onClick={() => openEdit(u)}><Pencil /></Button>
                    </PermissionGate>
                    <PermissionGate required={PERM.USERS_DEACTIVATE} mode="hide">
                      <Button size="icon" variant="ghost" onClick={() => remove(u)}><Trash2 /></Button>
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
        mode="hide"
      >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-3xl">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>{editing ? "Edit staff member" : "Add staff member"}</DialogTitle>
            <DialogDescription>Profile, homepage visibility and permissions.</DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-6 p-6">
              {/* PROFILE */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Profile</h3>

                <Field label="Photo">
                  <ImageField value={form.profilePicture} onChange={(v) => set("profilePicture", v)} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="user-name" label="Full name" error={errors.name}>
                    <Input id="user-name" className="rounded-none" value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </Field>
                  <Field id="user-email" label="Email" error={errors.email}>
                    <Input id="user-email" type="email" className="rounded-none" value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </Field>
                  <Field
                    id="user-password"
                    label="Password"
                    error={errors.password}
                    hint={editing ? "Leave blank to keep the current password." : "At least 6 characters."}
                  >
                    <Input id="user-password" type="password" className="rounded-none" value={form.password} onChange={(e) => set("password", e.target.value)} />
                  </Field>

                  <div className="flex items-center justify-between gap-3 self-end border p-3">
                    <Label htmlFor="user-active" className="cursor-pointer">Account is active (can sign in)</Label>
                    <Switch id="user-active" checked={form.active} onCheckedChange={(v) => set("active", v)} />
                  </div>
                </div>
              </section>

              <Separator />

              {/* HOMEPAGE */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Homepage team</h3>

                <div className="flex items-center justify-between gap-3 border p-3">
                  <div>
                    <Label htmlFor="user-featured" className="cursor-pointer">Show this person on the homepage</Label>
                    <p className="text-xs text-muted-foreground">Requires a job title.</p>
                  </div>
                  <Switch id="user-featured" checked={form.showOnHomepage} onCheckedChange={(v) => set("showOnHomepage", v)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="user-job" label="Job title" error={errors.jobTitle} hint='Shown publicly, e.g. "Showroom Manager".'>
                    <Input id="user-job" className="rounded-none" maxLength={100} value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} />
                  </Field>
                  <Field id="user-order" label="Display order" hint="Lower numbers appear first.">
                    <Input id="user-order" type="number" className="rounded-none" value={form.displayOrder} onChange={(e) => set("displayOrder", Number(e.target.value))} />
                  </Field>
                </div>

                <Field id="user-bio" label="Short bio" hint={`${form.bio.length}/500`}>
                  <Textarea id="user-bio" className="min-h-20 rounded-none" maxLength={500} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
                </Field>
              </section>

              <Separator />

              {/* PERMISSIONS */}
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Permissions</h3>
                  <div className="flex flex-wrap gap-1">
                    {ROLE_PRESETS.map((p) => (
                      <Button key={p.name} type="button" size="sm" variant="outline" className="rounded-none" onClick={() => set("permissions", p.permissions)}>
                        {p.name}
                      </Button>
                    ))}
                    <Button type="button" size="sm" variant="ghost" className="rounded-none" onClick={() => set("permissions", [])}>
                      Clear
                    </Button>
                  </div>
                </div>
                {!editing && (
                  <p className="text-xs text-muted-foreground">
                    New staff accounts start with the Support staff permissions. You can adjust them before creating the account.
                  </p>
                )}

                {form.permissions.includes("admin") && (
                  <Alert className="rounded-none">
                    <AlertDescription>Administrator has full access. The other permissions are implied.</AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  {PERMISSION_GROUPS.map((g) => (
                    <div key={g.group} className="space-y-3">
                      <Badge variant="secondary" className="rounded-none">{g.group}</Badge>
                      {g.items.map((i) => {
                        const id = `perm-${i.code}`;
                        return (
                          <div key={i.code} className="flex items-start gap-2">
                            <Checkbox
                              id={id}
                              className="mt-0.5"
                              checked={form.permissions.includes(i.code)}
                              onCheckedChange={() => togglePerm(i.code)}
                            />
                            <div className="grid gap-0.5 leading-none">
                              <Label htmlFor={id} className="cursor-pointer">{i.label}</Label>
                              <p className="text-xs text-muted-foreground">{i.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <Separator />

          <DialogFooter className="p-6 pt-4">
            <Button variant="outline" className="rounded-none" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="rounded-none" disabled={saving} onClick={save}>
              {saving && <Loader2 className="animate-spin" />} {editing ? "Save changes" : "Create staff account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </PermissionGate>
    </div>
  );
}

export default function AdminUsersPage() {
  const pathname = usePathname();
  return pathname.endsWith("/staff") ? <StaffManagementPage /> : <RegularUsersPage />;
}