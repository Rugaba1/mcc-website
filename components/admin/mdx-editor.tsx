"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, ImageIcon, Italic, Link2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePickerDialog } from "@/components/admin/image-picker-dialog";
import type { MediaFile } from "@/lib/api";

const safeAlt = (s: string) => s.replace(/[\[\]]/g, " ").replace(/\.[a-z0-9]+$/i, "").trim();
const safeUrl = (u: string) => u.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");

export function MdxEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const [picking, setPicking] = useState(false);

    // Replace the current selection; `select` returns the range to highlight afterwards.
    const edit = (
        build: (selected: string) => string,
        select?: (start: number, inserted: string) => [number, number],
    ) => {
        const el = ref.current;
        if (!el) return;
        const { selectionStart: s, selectionEnd: e } = el;
        const inserted = build(value.slice(s, e));
        onChange(value.slice(0, s) + inserted + value.slice(e));
        requestAnimationFrame(() => {
            el.focus();
            const [a, b] = select ? select(s, inserted) : [s + inserted.length, s + inserted.length];
            el.setSelectionRange(a, b);
        });
    };

    const wrap = (before: string, after = before, placeholder = "text") =>
        edit(
            (sel) => `${before}${sel || placeholder}${after}`,
            (s, ins) => [s + before.length, s + ins.length - after.length],
        );

    const insertImage = (file: MediaFile) => {
        const alt = safeAlt(file.alt || file.name);
        const prefix = "\n\n![";
        edit(
            () => `${prefix}${alt}](${safeUrl(file.url)})\n\n`,
            (s) => [s + prefix.length, s + prefix.length + alt.length], // select alt text
        );
    };

    const tools = [
        { icon: Heading2, label: "Heading", run: () => edit((sel) => `\n\n## ${sel || "Heading"}\n\n`) },
        { icon: Bold, label: "Bold", run: () => wrap("**") },
        { icon: Italic, label: "Italic", run: () => wrap("_") },
        { icon: List, label: "List", run: () => edit((sel) => `\n- ${sel || "Item"}\n- `) },
        { icon: Link2, label: "Link", run: () => edit((sel) => `[${sel || "link text"}](https://)`) },
    ];

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1 border p-1">
                {tools.map(({ icon: Icon, label, run }) => (
                    <Button key={label} type="button" variant="ghost" size="icon" className="size-8 rounded-none" onClick={run} aria-label={label}>
                        <Icon />
                    </Button>
                ))}
                <Button type="button" variant="ghost" size="sm" className="rounded-none" onClick={() => setPicking(true)}>
                    <ImageIcon /> Image
                </Button>
            </div>
            <Textarea
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-112 rounded-none font-mono text-sm"
                spellCheck
            />
            <ImagePickerDialog open={picking} onOpenChange={setPicking} onSelect={insertImage} />
        </div>
    );
}