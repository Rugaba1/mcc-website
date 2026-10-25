"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RwandaTinInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function RwandaTinInput({
  id = "rwanda-tin",
  value,
  onChange,
  error,
}: RwandaTinInputProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Rwanda TIN (optional)</Label>
      <Input
        id={id}
        name="tin"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={9}
        pattern="[0-9]{9}"
        placeholder="123456789"
        value={value}
        onChange={(event) =>
          onChange(event.currentTarget.value.replace(/\D/g, "").slice(0, 9))
        }
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helpId}
        className="rounded-none"
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        <p id={helpId} className="text-xs text-muted-foreground">
          Enter the 9-digit TIN issued by RRA.
        </p>
      )}
    </div>
  );
}
