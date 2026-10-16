"use client";

import { useState } from "react";
import { ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, type Collection, type Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "../fields";
import { ImageUploader } from "../image-uploader";
import { TilePicker } from "../tile-picker";

type Form = Omit<Collection, "id">;
const empty = (): Form => ({ name: "", description: "", image: "", tileIds: [], featured: false });

export function CollectionsSection({
  collections,
  products,
  reload,
}: {
  collections: Collection[];
  products: Product[];
  reload: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState<Collection | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(empty());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const setF = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTile = (id: number) =>
    setForm((f) => ({
      ...f,
      tileIds: f.tileIds.includes(id) ? f.tileIds.filter((t) => t !== id) : [...f.tileIds, id],
    }));

  const openNew = () => { setEditing(null); setForm(empty()); setShowForm(true); };
  const openEdit = (c: Collection) => { setEditing(c); setForm({ ...c }); setShowForm(true); };
  const cancel = () => { setEditing(null); setForm(empty()); setShowForm(false); };

  async function save() {
    if (!form.name.trim()) return toast.error("Name required");
    setSaving(true);
    try {
      if (editing) await api.updateCollection(editing.id, form);
      else await api.createCollection(form);
      toast.success(editing ? "Collection updated" : "Collection created");
      await reload();
      cancel();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this collection?")) return;
    try {
      await api.deleteCollection(id);
      await reload();
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  const visible = collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold">Collections</h2>
          <p className="text-sm text-muted-foreground">{collections.length} in database</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Collection
        </Button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-border bg-background p-6">
          <h3 className="mb-5 font-bold">{editing ? `Editing: ${editing.name}` : "Add Collection"}</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Terrain Series" />
            </div>
            <label className="flex items-center gap-3 pt-5 text-sm font-medium">
              <input type="checkbox" checked={form.featured} onChange={(e) => setF("featured", e.target.checked)} className="h-4 w-4 accent-primary" />
              Featured on site
            </label>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setF("description", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <ImageUploader label="Cover Image" value={form.image} onChange={(u) => setF("image", u)} />
            </div>
            <div className="sm:col-span-2">
              <TilePicker label="Tiles in this collection" products={products} selected={form.tileIds} onToggle={toggleTile} />
            </div>
          </div>
          <div className="mt-6 flex gap-3 border-t border-border pt-5">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Collection"}
            </Button>
            <Button variant="outline" onClick={cancel}>Cancel</Button>
          </div>
        </div>
      )}

      <Input className="max-w-xs" placeholder="Search collections…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-muted-foreground">
            No collections yet.
          </p>
        )}
        {visible.map((col) => {
          const tiles = products.filter((p) => col.tileIds.includes(p.id));
          return (
            <div key={col.id} className="group overflow-hidden rounded-2xl border border-border bg-background">
              <div className="relative h-44 overflow-hidden bg-muted">
                {col.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={col.image} alt={col.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {col.featured && (
                  <span className="absolute left-0 top-3 bg-primary px-3 py-1 text-[10px] font-bold uppercase text-primary-foreground">
                    Featured
                  </span>
                )}
                <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white">
                  {tiles.length} tiles
                </span>
              </div>
              <div className="p-4">
                <h3 className="mb-1 text-sm font-bold">{col.name}</h3>
                <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{col.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(col)}>Edit</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-destructive" onClick={() => remove(col.id)}>Delete</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}