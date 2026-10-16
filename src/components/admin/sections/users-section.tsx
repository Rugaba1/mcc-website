"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input, Label, Select } from "../fields";
import { Modal } from "../modal";

interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  canProducts: boolean;
  canCollections: boolean;
  canProjects: boolean;
  canTestimonials: boolean;
  canUsers: boolean;
}

type Editing = Omit<UserRecord, "id"> & { id?: number; password: string };
type PermKey = "canProducts" | "canCollections" | "canProjects" | "canTestimonials" | "canUsers";

const PERMS: { key: PermKey; label: string }[] = [
  { key: "canProducts", label: "Tiles / Products" },
  { key: "canCollections", label: "Collections" },
  { key: "canProjects", label: "Projects" },
  { key: "canTestimonials", label: "Testimonials" },
  { key: "canUsers", label: "User Management" },
];

const blank = (): Editing => ({
  name: "", email: "", password: "", role: "staff", active: true,
  canProducts: true, canCollections: true, canProjects: true, canTestimonials: true, canUsers: false,
});

export function UsersSection() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers((await apiClient.get("/api/users")).data);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = <K extends keyof Editing>(k: K, v: Editing[K]) =>
    setEditing((p) => (p ? { ...p, [k]: v } : p));

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { id, password, ...rest } = editing;
      const body = id && !password ? rest : { ...rest, password };
      if (id) await apiClient.put(`/api/users/${id}`, body);
      else await apiClient.post("/api/users", body);
      toast.success(id ? "User updated" : "User created");
      setEditing(null);
      void load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await apiClient.delete(`/api/users/${id}`);
      toast.success("User deleted");
      void load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">User Management</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Create accounts and control section access.</p>
        </div>
        <Button onClick={() => setEditing(blank())}>
          <Plus className="mr-2 h-4 w-4" /> New User
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        {loading ? (
          <p className="animate-pulse p-10 text-center text-sm text-muted-foreground">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted text-left">
                {["User", "Role", "Status", "Permissions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const granted = PERMS.filter((p) => u[p.key]);
                return (
                  <tr key={u.id} className="hover:bg-muted/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">{u.role}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${u.active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {granted.map((p) => (
                          <span key={p.key} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold">{p.label}</span>
                        ))}
                        {granted.length === 0 && <span className="text-xs italic text-muted-foreground">No access</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing({ ...u, password: "" })}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => remove(u.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal
          title={editing.id ? "Edit User" : "Create User"}
          maxWidth="max-w-lg"
          onClose={() => setEditing(null)}
          onSave={save}
          saving={saving}
          saveLabel={editing.id ? "Save Changes" : "Create User"}
          saveDisabled={!editing.name || !editing.email || (!editing.id && !editing.password)}
        >
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input value={editing.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div>
              <Label>Role</Label>
              <Select value={editing.role} onChange={(e) => set("role", e.target.value)}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
          </div>
          <div><Label>Email</Label><Input type="email" value={editing.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div>
            <Label>{editing.id ? "New password (leave blank to keep)" : "Password"}</Label>
            <Input type="password" autoComplete="new-password" value={editing.password} onChange={(e) => set("password", e.target.value)} placeholder="Min 8 characters" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted p-3">
            <span className="text-sm">Account active (can log in)</span>
            <Switch checked={editing.active} onCheckedChange={(v) => set("active", v)} />
          </div>
          <div>
            <Label>Permissions</Label>
            <div className="divide-y divide-border rounded-xl border border-border">
              {PERMS.map((p) => (
                <div key={p.key} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">{p.label}</span>
                  <Switch checked={editing[p.key]} onCheckedChange={(v) => set(p.key, v)} />
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}