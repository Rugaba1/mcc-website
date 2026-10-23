"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bold, Eye, Italic, Link2, List, MessageSquareQuote, Smile, Type } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const tools = [
    { label: "Bold", icon: Bold, before: "**", after: "**", placeholder: "bold text" },
    { label: "Italic", icon: Italic, before: "_", after: "_", placeholder: "italic text" },
    { label: "Heading", icon: Type, before: "### ", after: "", placeholder: "Heading" },
    { label: "Bulleted list", icon: List, before: "\n- ", after: "", placeholder: "List item" },
    { label: "Quote", icon: MessageSquareQuote, before: "\n> ", after: "", placeholder: "Quote" },
    { label: "Link", icon: Link2, before: "[", after: "](https://)", placeholder: "link text" },
];

export function ReviewMarkdownEditor({
    id,
    value,
    onChange,
    maxLength = 4000,
}: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    maxLength?: number;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mode, setMode] = useState<"write" | "preview">("write");
    const [emojiOpen, setEmojiOpen] = useState(false);

    const insert = (before: string, after = "", placeholder = "") => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = value.slice(start, end) || placeholder;
        const nextValue = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
        onChange(nextValue);
        requestAnimationFrame(() => {
            textarea.focus();
            const selectionStart = start + before.length;
            textarea.setSelectionRange(selectionStart, selectionStart + selected.length);
        });
    };

    return (
        <div className="border border-input">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 p-2">
                <div className="flex flex-wrap items-center gap-1">
                    {tools.map(({ label, icon: Icon, before, after, placeholder }) => (
                        <Button
                            key={label}
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            disabled={mode !== "write"}
                            aria-label={label}
                            title={label}
                            onClick={() => insert(before, after, placeholder)}
                        >
                            <Icon className="size-4" />
                        </Button>
                    ))}
                    <div className="relative">
                        <Button
                            type="button"
                            variant={emojiOpen ? "secondary" : "ghost"}
                            size="icon"
                            className="size-8"
                            disabled={mode !== "write"}
                            aria-label="Insert emoji"
                            title="Insert emoji"
                            onClick={() => setEmojiOpen((open) => !open)}
                        >
                            <Smile className="size-4" />
                        </Button>
                        {emojiOpen && (
                            <div className="absolute left-0 top-10 z-20">
                                <EmojiPicker
                                    onEmojiClick={(emoji) => {
                                        insert(emoji.emoji);
                                        setEmojiOpen(false);
                                    }}
                                    width={320}
                                    height={380}
                                    searchDisabled={false}
                                    skinTonesDisabled
                                />
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-1" role="tablist" aria-label="Review editor mode">
                    <Button type="button" role="tab" aria-selected={mode === "write"} variant={mode === "write" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("write")}>Write</Button>
                    <Button type="button" role="tab" aria-selected={mode === "preview"} variant={mode === "preview" ? "secondary" : "ghost"} size="sm" onClick={() => setMode("preview")}><Eye /> Preview</Button>
                </div>
            </div>

            {mode === "write" ? (
                <Textarea
                    ref={textareaRef}
                    id={id}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    rows={7}
                    maxLength={maxLength}
                    required
                    spellCheck
                    placeholder="What did you think about this product?"
                    className="min-h-40 resize-y rounded-none border-0 shadow-none focus-visible:ring-0"
                />
            ) : (
                <div className="min-h-40 px-3 py-2">
                    {value.trim() ? (
                        <div className="prose prose-sm max-w-none text-foreground prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-a:text-primary">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
                        </div>
                    ) : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
                </div>
            )}
            <div className="border-t px-3 py-1.5 text-right text-xs text-muted-foreground">{value.length}/{maxLength}</div>
        </div>
    );
}
