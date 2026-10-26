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

function toLocalDateTime(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function PaidAtAlertDialog({
  open,
  onOpenChange,
  initialValue,
  busy = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: string | null;
  busy?: boolean;
  onConfirm: (paidAt: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState(() => toLocalDateTime(initialValue));

  useEffect(() => {
    if (open) setValue(toLocalDateTime(initialValue));
  }, [initialValue, open]);

  const confirm = () => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return;
    void onConfirm(date.toISOString());
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>When was this payment received?</AlertDialogTitle>
          <AlertDialogDescription>
            Record the actual date and time the money arrived. This is used for payment and financial reporting.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <DateTimePicker
          id="payment-received-at"
          value={value}
          onChange={setValue}
          allowPast
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button type="button" onClick={confirm} disabled={busy || !value}>
            {busy ? "Saving…" : "Confirm payment"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
