"use client";

import { useEffect, useState } from "react";
import { DateTimePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function toLocalDateTime(value?: string | null, roundUp = false) {
  const date = value ? new Date(value) : new Date();
  if (roundUp && (date.getSeconds() > 0 || date.getMilliseconds() > 0)) {
    date.setMinutes(date.getMinutes() + 1, 0, 0);
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function PaidAtAlertDialog({
  open,
  onOpenChange,
  initialValue,
  eventLabel = "payment received",
  minimumDateTime,
  busy = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: string | null;
  eventLabel?: string;
  minimumDateTime?: string | null;
  busy?: boolean;
  onConfirm: (paidAt: string) => void | Promise<void>;
}) {
  const minimumValue = minimumDateTime
    ? toLocalDateTime(minimumDateTime, true)
    : undefined;
  const clampToMinimum = (value?: string | null) => {
    const localValue = toLocalDateTime(value);
    return minimumValue && localValue < minimumValue ? minimumValue : localValue;
  };
  const [value, setValue] = useState(() => clampToMinimum(initialValue));

  useEffect(() => {
    if (!open) return;
    const localValue = toLocalDateTime(initialValue);
    setValue(minimumValue && localValue < minimumValue ? minimumValue : localValue);
  }, [initialValue, minimumValue, open]);

  const confirm = () => {
    const date = new Date(value);
    if (
      !value ||
      Number.isNaN(date.getTime()) ||
      (minimumValue && value < minimumValue)
    )
      return;
    void onConfirm(date.toISOString());
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>When was this {eventLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            Record the actual date and time. This is used for the order history and reporting.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <DateTimePicker
          id="order-status-at"
          value={value}
          onChange={setValue}
          allowPast
          minDateTime={minimumValue}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            onClick={confirm}
            disabled={busy || !value || Boolean(minimumValue && value < minimumValue)}
          >
            {busy ? "Saving…" : "Confirm"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
