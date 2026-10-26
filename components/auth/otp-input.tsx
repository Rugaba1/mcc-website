"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
};

export function OtpInput({
  id,
  value,
  onChange,
  autoFocus = false,
  disabled = false,
}: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.slice(0, 6).split("");
  const activeIndex = Math.min(digits.length, 5);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div
      className={cn(
        "relative grid w-full max-w-sm grid-cols-6 gap-2 rounded-md outline-none  ",
        disabled && "opacity-50",
      )}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            "flex aspect-square min-w-0 items-center justify-center rounded-md border border-input bg-background text-xl font-semibold tabular-nums transition-colors sm:text-2xl",
            focused && activeIndex === index && "border-ring ring-1 ring-ring",
          )}
        >
          {digits[index] ?? ""}
        </span>
      ))}
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoCapitalize="off"
        spellCheck={false}
        required
        pattern="[0-9]{6}"
        aria-label="6-digit verification code"
        disabled={disabled}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => {
          onChange(event.target.value.replace(/\D/g, "").slice(0, 6));
        }}
        onKeyDown={(event) => {
          if (
            event.key.length === 1 &&
            !/[0-9]/.test(event.key) &&
            !event.metaKey &&
            !event.ctrlKey
          ) {
            event.preventDefault();
          }
        }}
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
      />
    </div>
  );
}
