"use client";

import { Input } from "@/components/ui/input";

type SizeInputProps = {
  id: string;
  label: string;
  value: string;
  unit?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
};

export function SizeInput({
  id,
  label,
  value,
  unit,
  placeholder,
  onValueChange,
}: SizeInputProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium leading-none">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          min="1"
          step="any"
          inputMode="decimal"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className={unit ? "pr-12" : undefined}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
