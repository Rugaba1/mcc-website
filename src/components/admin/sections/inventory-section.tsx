"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage, type InventoryItem } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "../fields";
import { Modal } from "../modal";

export function InventorySection({
  items,
  reload,
}: {
  items: InventoryItem[];
  reload: () => void;
}) {
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  const isLow = (i: InventoryItem) => i.stockBoxes <= i.lowStockThreshold;

  const visible = items.filter(
    (i) =>
      (!lowOnly || isLow(i)) &&
      `${i.productName} ${i.sku} ${i.size}`.toLowerCase().includes(search.toLowerCase()),
  );

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.updateStock(editing.id, {
        stockBoxes: editing.stockBoxes,
        lowStockThreshold: editing.lowStockThreshold,
      });
      toast.success("Stock updated");
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Update failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Inventory</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} variants · {items.filter(isLow).length} low on stock
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              className="accent-primary"
            />
            Low stock only
          </label>
          <Input
            aria-label="Search inventory"
            placeholder="Product or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-60"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left">
              {["Product", "SKU", "Size", "In stock (boxes)", "Alert at", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((i) => (
              <tr key={i.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <p className="font-medium">{i.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {[i.finish, i.color].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-4 py-3">{i.sku}</td>
                <td className="px-4 py-3">{i.size}</td>
                <td className="px-4 py-3">
                  <span className="mr-2 font-semibold">{i.stockBoxes}</span>
                  {i.stockBoxes === 0 ? (
                    <Badge variant="destructive">Out</Badge>
                  ) : isLow(i) ? (
                    <Badge variant="outline">Low</Badge>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{i.lowStockThreshold}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" aria-label="Edit stock" onClick={() => setEditing({ ...i })}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Nothing to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={`${editing.productName} · ${editing.sku}`}
          maxWidth="max-w-sm"
          onClose={() => setEditing(null)}
          onSave={save}
          saving={saving}
        >
          <div>
            <Label>Boxes in stock</Label>
            <Input
              type="number"
              min={0}
              value={editing.stockBoxes}
              onChange={(e) =>
                setEditing({ ...editing, stockBoxes: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </div>
          <div>
            <Label>Low-stock alert at</Label>
            <Input
              type="number"
              min={0}
              value={editing.lowStockThreshold}
              onChange={(e) =>
                setEditing({ ...editing, lowStockThreshold: Math.max(0, Number(e.target.value) || 0) })
              }
            />
          </div>
        </Modal>
      )}
    </div>
  );
}