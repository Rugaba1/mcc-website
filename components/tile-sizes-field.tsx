"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SizeInput } from "@/components/ui/size-input";

const COMMON_SIZES = [
  "300×300mm",
  "300×600mm",
  "600×600mm",
  "600×1200mm",
  "800×800mm",
];

function parseSizes(value: string) {
  return value
    .split(/[&,]/)
    .map((size) => size.trim())
    .filter(Boolean);
}

export function TileSizesField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const sizes = useMemo(() => parseSizes(value), [value]);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState("mm");

  function addSize(size: string) {
    if (sizes.some((current) => current.toLowerCase() === size.toLowerCase())) return;
    onChange([...sizes, size].join(" & "));
  }

  function removeSize(index: number) {
    onChange(sizes.filter((_, itemIndex) => itemIndex !== index).join(" & "));
  }

  function addCustomSize() {
    const w = Number(width);
    const h = Number(height);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
    addSize(`${w}×${h}${unit}`);
    setWidth("");
    setHeight("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" aria-label="Selected fallback sizes">
        {sizes.map((size, index) => (
          <span key={`${size}-${index}`} className="inline-flex items-center gap-1 border bg-muted px-2 py-1 text-sm">
            {size}
            <button
              type="button"
              aria-label={`Remove size ${size}`}
              onClick={() => removeSize(index)}
              className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        {!sizes.length && (
          <span className="text-sm text-muted-foreground">No fallback sizes added.</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_6rem_auto]">
        <SizeInput id="tile-size-width" label="Width" value={width} unit={unit} placeholder="600" onValueChange={setWidth} />
        <SizeInput id="tile-size-height" label="Height" value={height} unit={unit} placeholder="600" onValueChange={setHeight} />
        <div className="col-span-2 space-y-1 sm:col-span-1">
          <Label htmlFor="tile-size-unit">Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger id="tile-size-unit" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mm">mm</SelectItem>
              <SelectItem value="cm">cm</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          aria-label="Add custom tile size"
          disabled={!width || !height || Number(width) <= 0 || Number(height) <= 0}
          onClick={addCustomSize}
          className="col-span-2 self-end sm:col-span-1"
        >
          <Plus /> Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {COMMON_SIZES.map((size) => (
          <Button
            key={size}
            type="button"
            size="sm"
            variant="outline"
            disabled={sizes.some((current) => current.toLowerCase() === size.toLowerCase())}
            onClick={() => addSize(size)}
          >
            <Plus /> {size}
          </Button>
        ))}
      </div>
    </div>
  );
}
