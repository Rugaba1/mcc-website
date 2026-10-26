"use client";

import { MediaImage } from "@/components/media-image";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { api, type Product, type Project } from "@/lib/api";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input, Label, Select, Textarea } from "../fields";
import { ImageUploader } from "../image-uploader";
import { TilePicker } from "@/components/tile-picker";

type Form = Omit<Project, "id">;

const TYPES = ["Residential", "Commercial", "Industrial", "Infrastructure", "Hospitality", "Healthcare", "Education", "Other"];

const empty = (): Form => ({
  title: "", type: "Residential", description: "", gradient: "from-[#1a3a2a] to-[#2d6a4f]",
  image: "", large: false, tileIds: [], location: "", area: "", year: "",
});

export function ProjectsSection({
  projects,
  products,
  reload,
}: {
  projects: Project[];
  products: Product[];
  reload: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(empty());
  const [saving, setSaving] = useState(false);

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTile = (id: number) =>
    setForm((f) => ({
      ...f,
      tileIds: f.tileIds.includes(id) ? f.tileIds.filter((t) => t !== id) : [...f.tileIds, id],
    }));

  const openNew = () => { setEditing(null); setForm(empty()); setShowForm(true); };
  const openEdit = (p: Project) => {
    const { id, ...rest } = p;
    setEditing(p);
    setForm({ ...rest, tileIds: p.tileIds ?? [] });
    setShowForm(true);
  };
  const cancel = () => { setEditing(null); setForm(empty()); setShowForm(false); };

  async function save() {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    try {
      if (editing) await api.updateProject(editing.id, form);
      else await api.createProject(form);
      toast.success(editing ? "Project updated" : "Project created");
      await reload();
      cancel();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this project?")) return;
    try {
      await api.deleteProject(id);
      await reload();
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold">Projects</h2>
          <p className="text-sm text-muted-foreground">{projects.length} in database</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-background p-6">
          <h3 className="mb-5 font-bold">{editing ? `Editing: ${editing.title}` : "Add Project"}</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="e.g. Kigali Convention Centre" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onChange={(e) => setF("type", e.target.value)}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setF("location", e.target.value)} /></div>
            <div><Label>Area</Label><Input value={form.area} onChange={(e) => setF("area", e.target.value)} placeholder="e.g. 12,000 m²" /></div>
            <div><Label>Year</Label><Input value={form.year} onChange={(e) => setF("year", e.target.value)} /></div>
            <label className="flex items-center gap-3 pt-5 text-sm font-medium">
              <Input type="checkbox" checked={form.large} onChange={(e) => setF("large", e.target.checked)} className="h-4 w-4 accent-primary" />
              Hero card
            </label>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setF("description", e.target.value)} /></div>
            <div className="sm:col-span-2"><ImageUploader label="Project Image" value={form.image} onChange={(u) => setF("image", u)} /></div>
            <div className="sm:col-span-2"><TilePicker label="Tiles used" products={products} selected={form.tileIds} onToggle={toggleTile} /></div>
          </div>
          <div className="mt-6 flex gap-3 border-t border-border pt-5">
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Project"}</Button>
            <Button variant="outline" onClick={cancel}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-muted-foreground">No projects yet.</p>
        )}
        {projects.map((p) => (
          <div key={p.id} className="group overflow-hidden rounded-2xl border border-border bg-background">
            <div className="relative h-40 overflow-hidden bg-muted">
              {p.image && (                <MediaImage src={p.image} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
              <Badge className="absolute left-3 top-3 h-auto rounded-none px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">{p.type}</Badge>
              {p.large && <Badge className="absolute right-3 top-3 h-auto bg-overlay px-2.5 py-1 text-[10px] font-bold text-overlay-foreground">HERO</Badge>}
            </div>
            <div className="p-4">
              <h3 className="mb-0.5 text-sm font-bold">{p.title}</h3>
              <div className="mb-3 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                {p.location && <span>{p.location}</span>}
                {p.area && <span>{p.area}</span>}
                {p.year && <span>{p.year}</span>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>Edit</Button>
                <Button variant="outline" size="sm" className="flex-1 text-destructive" onClick={() => remove(p.id)}>Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}