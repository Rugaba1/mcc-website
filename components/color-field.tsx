"use client";

import { useState } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

extend([namesPlugin]);

export const isHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
/** "#c9a27a" → "tan" (closest CSS color name). Legacy plain-text colors pass through. */
export const colorName = (v: string) => (isHex(v) ? (colord(v).toName({ closest: true }) ?? v) : v);

const PRESETS = ["#ffffff", "#f5f0e6", "#d9cfc1", "#bfb5a8", "#8c8c8c", "#4a4a4a", "#1c1c1c", "#c9a27a", "#8b5e3c", "#b5543a", "#5b7c99", "#6b8e6b"];

export function Swatch({ value }: { value: string }) {
  return <span className="inline-block size-4 shrink-0 border" style={{ background: isHex(value) ? value : "transparent" }} />;
}

function Panel({ initial, label, onPick }: { initial: string; label: string; onPick: (hex: string) => void }) {
  const [hex, setHex] = useState(isHex(initial) ? initial : "#c9a27a");
  return (
    <div className="w-60 space-y-3">
      <HexColorPicker color={hex} onChange={setHex} style={{ width: "100%" }} />
      <div className="flex items-center gap-2">
        <Swatch value={hex} />
        <HexColorInput prefixed color={hex} onChange={setHex} className="h-8 w-full border bg-background px-2 text-sm outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <p className="text-xs capitalize text-muted-foreground">Looks like {colorName(hex)}</p>
      <div className="grid grid-cols-6 gap-1.5">
        {PRESETS.map((p) => (
          <button key={p} type="button" aria-label={p} className="aspect-square border" style={{ background: p }} onClick={() => setHex(p)} />
        ))}
      </div>
      <Button type="button" className="w-full rounded-none" onClick={() => onPick(hex.toLowerCase())}>{label}</Button>
    </div>
  );
}

/** Several colors → product.colors (string[] of hex values). */
export function ColorsField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {value.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5 border bg-secondary px-2 py-1 text-xs capitalize">
          <Swatch value={c} />
          {colorName(c)}
          <button type="button" aria-label={`Remove ${c}`} onClick={() => onChange(value.filter((x) => x !== c))}><X className="size-3" /></button>
        </span>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="rounded-none"><Plus /> Add color</Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-none p-3" align="start">
          <Panel initial="#c9a27a" label="Add color" onPick={(hex) => { if (!value.includes(hex)) onChange([...value, hex]); setOpen(false); }} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** One color → variant.color. */
export function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="flex-1 justify-start rounded-none capitalize">
            {value ? <><Swatch value={value} /> {colorName(value)}</> : "Pick a color"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-none p-3" align="start">
          <Panel initial={value} label="Use this color" onPick={(hex) => { onChange(hex); setOpen(false); }} />
        </PopoverContent>
      </Popover>
      {value && <Button type="button" variant="ghost" size="icon" className="rounded-none" onClick={() => onChange("")} aria-label="Clear color"><X /></Button>}
    </div>
  );
}
