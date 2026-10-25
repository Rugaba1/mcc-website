"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRESETS = [
  { name: "Stone", colors: ["#e5e5e5", "#cfcfcf"] },
  { name: "Sand", colors: ["#e8d8bc", "#bca27a"] },
  { name: "Clay", colors: ["#d49a77", "#875b46"] },
  { name: "Slate", colors: ["#8b969c", "#38444c"] },
  { name: "Forest", colors: ["#1a3a2a", "#2d6a4f"] },
  { name: "Night", colors: ["#383838", "#101010"] },
] as const;

const DIRECTIONS = ["90deg", "135deg", "180deg", "225deg"] as const;
const DEFAULT_COLORS = ["#e5e5e5", "#cfcfcf"] as const;

function parseColors(value: string): [string, string] {
  const matches = value.match(/#[\da-f]{3,8}\b/gi) ?? [];
  if (matches.length >= 2) {
    return [
      matches[0] ?? DEFAULT_COLORS[0],
      matches[1] ?? DEFAULT_COLORS[1],
    ];
  }
  return [DEFAULT_COLORS[0], DEFAULT_COLORS[1]];
}

function parseDirection(value: string) {
  const match = value.match(/(\d{1,3}deg)/i);
  return DIRECTIONS.includes(match?.[1] as (typeof DIRECTIONS)[number])
    ? (match?.[1] as (typeof DIRECTIONS)[number])
    : "135deg";
}

function toCssGradient(value: string) {
  if (value.startsWith("linear-gradient(")) return value;
  const colors = parseColors(value);
  return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
}

export function GradientField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [colors, setColors] = useState<[string, string]>(() => parseColors(value));
  const [direction, setDirection] = useState(() => parseDirection(value));

  useEffect(() => {
    setColors(parseColors(value));
    setDirection(parseDirection(value));
  }, [value]);

  function update(nextColors: [string, string], nextDirection = direction) {
    setColors(nextColors);
    setDirection(nextDirection);
    onChange(`linear-gradient(${nextDirection}, ${nextColors[0]}, ${nextColors[1]})`);
  }

  return (
    <div className="space-y-3">
      <div
        aria-label="Gradient preview"
        className="h-16 w-full border"
        style={{ background: value ? toCssGradient(value) : "var(--muted)" }}
      />
      <div className="grid grid-cols-2 gap-3">
        {colors.map((color, index) => (
          <div key={index} className="space-y-1.5">
            <Label htmlFor={`${id}-color-${index + 1}`}>Color {index + 1}</Label>
            <input
              id={`${id}-color-${index + 1}`}
              type="color"
              value={color}
              onChange={(event) => {
                const next = [...colors] as [string, string];
                next[index] = event.target.value;
                update(next);
              }}
              className="h-10 w-full cursor-pointer border border-input bg-background p-1"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-36 space-y-1.5">
          <Label htmlFor={`${id}-direction`}>Direction</Label>
          <Select
            value={direction}
            onValueChange={(next) =>
              update(colors, next as (typeof DIRECTIONS)[number])
            }
          >
            <SelectTrigger id={`${id}-direction`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIRECTIONS.map((angle) => (
                <SelectItem key={angle} value={angle}>{angle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {value && (
          <Button type="button" variant="outline" onClick={() => onChange("")}>
            <RotateCcw /> Clear gradient
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const presetValue = `linear-gradient(${direction}, ${preset.colors[0]}, ${preset.colors[1]})`;
          return (
            <button
              key={preset.name}
              type="button"
              aria-label={`Use ${preset.name} gradient`}
              aria-pressed={value === presetValue}
              title={preset.name}
              onClick={() =>
                update([...preset.colors] as [string, string])
              }
              className="h-8 w-12 border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})` }}
            />
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Optional background shown behind an image while it loads.
      </p>
    </div>
  );
}
