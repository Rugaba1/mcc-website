import React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full  border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} {...props} className={cn(field, className)} />
));
Input.displayName = "Input";

export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cn(field, "resize-none", className)} />;
}

export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cn(field, className)} />;
}