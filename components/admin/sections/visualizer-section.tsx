"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, apiErrorMessage, type Product, type ProductVariant } from "@/lib/api";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { ImageUploader } from "../image-uploader";
import { Modal } from "../modal";
import { Input } from "@/components/ui/input";

type Row = ProductVariant & { productName: string };

export function VisualizerSection({
  products,
  reload,
}: {
  products: Product[];
  reload: () => void;
}) {
  const [missingOnly, setMissingOnly] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const rows: Row[] = products.flatMap((p) =>
    (p.variants ?? []).map((v) => ({ ...v, productName: p.name })),
  );
  const ready = rows.filter((r) => r.textureUrl).length;
  const visible = missingOnly ? rows.filter((r) => !r.textureUrl) : rows;

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.updateVariantTexture(editing.id, editing.textureUrl || null);
      toast.success("Texture saved");
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Save failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Visualizer textures</h2>
          <p className="text-sm text-muted-foreground">
            {ready} of {rows.length} variants ready for the room visualizer
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Input
            type="checkbox"
            checked={missingOnly}
            onChange={(e) => setMissingOnly(e.target.checked)}
            className="accent-primary"
          />
          Missing texture only
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((v) => (
          <div key={v.id} className="overflow-hidden  border border-border bg-background">
            <div className="flex h-32 items-center justify-center bg-muted">
              {v.textureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.textureUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Badge variant="outline">No texture</Badge>
              )}
            </div>
            <div className="space-y-2 p-3">
              <div>
                <p className="truncate text-sm font-semibold">{v.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {v.sku} · {v.size}
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setEditing({ ...v })}>
                {v.textureUrl ? "Change texture" : "Add texture"}
              </Button>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No variants yet. Add variants to your products first." : "All variants have textures."}
          </p>
        )}
      </div>

      {editing && (
        <Modal
          title={`${editing.productName} · ${editing.sku}`}
          maxWidth="max-w-md"
          onClose={() => setEditing(null)}
          onSave={save}
          saving={saving}
        >
          <ImageUploader
            label="Seamless texture image"
            value={editing.textureUrl ?? ""}
            onChange={(url) => setEditing({ ...editing, textureUrl: url })}
          />
          <p className="text-xs text-muted-foreground">
            Use a square, seamlessly tiling image (for example 1024×1024). It is repeated across
            the floor or wall in the visualizer.
          </p>
        </Modal>
      )}
    </div>
  );
}