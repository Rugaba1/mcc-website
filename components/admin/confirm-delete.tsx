"use client";

import { Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ConfirmDelete({
    open,
    onOpenChange,
    title,
    description,
    busy,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    busy: boolean;
    onConfirm: () => void;
}) {
    return (
        <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
            <AlertDialogContent className="rounded-none">
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none" disabled={busy}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={busy}
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                    >
                        {busy && <Loader2 className="animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}