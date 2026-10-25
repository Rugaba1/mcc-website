"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import { useTheme } from "next-themes";
import {
  Bold,
  CheckSquare,
  Code,
  Columns2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Smile,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Quote,
  Strikethrough,
  Table2,
  Minus,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagePickerDialog } from "@/components/admin/image-picker-dialog";
import type { MediaFile } from "@/lib/api";
import { cn } from "cn";
import {
  mdxComponents,
  mdxRehypePlugins,
  mdxRemarkPlugins,
} from "@/components/blog/mdx-renderers";

type EditorMode = "write" | "preview" | "split";

const safeAlt = (value: string) =>
  value.replace(/[\[\]]/g, " ").replace(/\.[a-z0-9]+$/i, "").trim();
const safeUrl = (value: string) =>
  value
    .replace(/ /g, "%20")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");
const validLinkUrl = (value: string) => {
  const url = value.trim();
  if (!url || /[\u0000-\u0020\\]/.test(url)) return null;
  if (/^(\/(?!\/)|#|\?)/.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    if (
      parsed.protocol === "mailto:" &&
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(parsed.pathname)
    ) {
      return url;
    }
  } catch {
    return null;
  }
  return null;
};

const toolbarButton = "rounded-none";

export function MarkdownEditor({
  value,
  onChange,
  disabled = false,
  maxLength,
  enableImages = true,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
  enableImages?: boolean;
  id?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme } = useTheme();
  const [mode, setMode] = useState<EditorMode>("write");
  const [pickingImage, setPickingImage] = useState(false);
  const [pickingEmoji, setPickingEmoji] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const linkSelection = useRef<[number, number]>([0, 0]);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreen]);

  function edit(
    build: (selected: string) => string,
    select?: (start: number, inserted: string, selected: string) => [number, number],
  ) {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const inserted = build(selected);
    onChange(value.slice(0, start) + inserted + value.slice(end));

    requestAnimationFrame(() => {
      textarea.focus();
      const [selectionStart, selectionEnd] = select
        ? select(start, inserted, selected)
        : [start + inserted.length, start + inserted.length];
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function wrap(before: string, after = before, placeholder = "text") {
    edit(
      (selected) => `${before}${selected || placeholder}${after}`,
      (start, inserted) => [
        start + before.length,
        start + inserted.length - after.length,
      ],
    );
  }

  function prefixLines(prefix: string, placeholder: string) {
    edit((selected) =>
      (selected || placeholder)
        .split("\n")
        .map((line) => `${prefix}${line}`)
        .join("\n"),
    );
  }

  function insertHeading(level: 1 | 2 | 3) {
    const headingPrefix = `${"#".repeat(level)} `;
    edit(
      (selected) => `${headingPrefix}${selected || "Heading"}`,
      (start, inserted) => [start + headingPrefix.length, start + inserted.length],
    );
  }

  function insertLink() {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    linkSelection.current = [start, end];
    setLinkLabel(value.slice(start, end));
    setLinkUrl("");
    setLinkError("");
    setLinkDialogOpen(true);
  }

  function applyLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = validLinkUrl(linkUrl);
    if (!url) {
      setLinkError("Enter a valid http(s), mailto, or same-site relative URL.");
      return;
    }
    const [start, end] = linkSelection.current;
    const label = linkLabel.trim()
      .replace(/\\/g, "\\\\")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]");
    if (!label) {
      setLinkError("Enter link text.");
      return;
    }
    const markdown = `[${label}](${safeUrl(url)})`;
    onChange(value.slice(0, start) + markdown + value.slice(end));
    setLinkDialogOpen(false);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const cursor = start + markdown.length;
      textareaRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  function insertEmoji(data: EmojiClickData) {
    edit(() => data.emoji);
    setPickingEmoji(false);
  }

  function insertImage(file: MediaFile) {
    const alt = safeAlt(file.alt || file.name);
    const prefix = "\n\n![";
    edit(
      () => `${prefix}${alt}](${safeUrl(file.url)})\n\n`,
      (start) => [start + prefix.length, start + prefix.length + alt.length],
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    const shortcuts: Record<string, () => void> = {
      b: () => wrap("**"),
      i: () => wrap("_"),
      k: insertLink,
    };
    const action = shortcuts[key];
    if (!action) return;
    event.preventDefault();
    action();
  }

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(words / 200));
  const modes: Array<{ id: EditorMode; label: string; icon: typeof Pencil }> = [
    { id: "write", label: "Write", icon: Pencil },
    { id: "split", label: "Split", icon: Columns2 },
    { id: "preview", label: "Preview", icon: Eye },
  ];

  const toolbar = (
    <div
      className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2"
      role="toolbar"
      aria-label="Markdown formatting"
    >
      <fieldset
        disabled={disabled || mode === "preview"}
        className="contents"
        aria-label="Formatting tools"
      >
      <div className="flex flex-wrap items-center gap-1 border-r pr-2">
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Heading 1" aria-label="Heading 1" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => insertHeading(1)}><Heading1 /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Heading 2" aria-label="Heading 2" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => insertHeading(2)}><Heading2 /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Heading 3" aria-label="Heading 3" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => insertHeading(3)}><Heading3 /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Bold (Ctrl+B)" aria-label="Bold" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => wrap("**")}><Bold /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Italic (Ctrl+I)" aria-label="Italic" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => wrap("_")}><Italic /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Strikethrough" aria-label="Strikethrough" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => wrap("~~")}><Strikethrough /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Inline code" aria-label="Inline code" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => wrap("`")}><Code /></Button>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-r pr-2">
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Bulleted list" aria-label="Bulleted list" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => prefixLines("- ", "List item")}><List /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Numbered list" aria-label="Numbered list" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => prefixLines("1. ", "List item")}><ListOrdered /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Task list" aria-label="Task list" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => prefixLines("- [ ] ", "Task")}><CheckSquare /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Block quote" aria-label="Block quote" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => prefixLines("> ", "Quote")}><Quote /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Code block" aria-label="Code block" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => wrap("```\n", "\n```", "code")}><Code /></Button>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-r pr-2">
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Insert link (Ctrl+K)" aria-label="Insert link" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={insertLink}><Link2 /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Insert emoji" aria-label="Insert emoji" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => setPickingEmoji(true)}><Smile /></Button>
        {enableImages && (
          <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Insert image" aria-label="Insert image" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => setPickingImage(true)}><ImageIcon /></Button>
        )}
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Insert table" aria-label="Insert table" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => edit(() => "\n\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n\n")}><Table2 /></Button>
        <Button type="button" variant="ghost" size="icon" className={toolbarButton} title="Horizontal rule" aria-label="Horizontal rule" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => edit(() => "\n\n---\n\n")}><Minus /></Button>
      </div>
      </fieldset>

      <div className="ml-auto flex items-center gap-1">
        <div className="mr-1 flex items-center rounded-md border p-0.5">
          {modes.map(({ id: modeId, label, icon: Icon }) => (
            <Button
              key={modeId}
              type="button"
              variant={mode === modeId ? "secondary" : "ghost"}
              size="sm"
              className="h-7 gap-1 px-2"
              aria-pressed={mode === modeId}
              onClick={() => setMode(modeId)}
            >
              <Icon /> <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={() => setFullscreen((current) => !current)}
        >
          {fullscreen ? <Minimize2 /> : <Maximize2 />}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <section
        className={cn(
          "overflow-hidden border bg-background",
          fullscreen && "fixed inset-0 z-50 flex flex-col",
        )}
        aria-label="Markdown editor"
      >
        {toolbar}
        <div
          className={cn(
            "grid min-h-80",
            mode === "split" && "md:grid-cols-2",
            fullscreen && "min-h-0 flex-1",
          )}
        >
          {mode !== "preview" && (
            <Textarea
              ref={textareaRef}
              id={id}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-h-80 resize-y rounded-none border-0 p-4 font-mono text-sm leading-6 focus-visible:ring-0 focus-visible:ring-offset-0",
                mode === "split" && "md:border-r",
                fullscreen && "h-full max-h-none resize-none",
              )}
              placeholder="Write your Markdown here…"
              spellCheck
              disabled={disabled}
              maxLength={maxLength}
              aria-label="Markdown source"
            />
          )}
          {mode !== "write" && (
            <article
              className={cn(
                "max-w-none overflow-auto p-4 text-foreground",
                mode === "split" && "min-h-80",
                fullscreen && "min-h-0",
              )}
              aria-label="Rendered Markdown preview"
            >
              {value.trim() ? (
                <ReactMarkdown
                  remarkPlugins={mdxRemarkPlugins}
                  rehypePlugins={mdxRehypePlugins}
                  components={mdxComponents}
                >
                  {value}
                </ReactMarkdown>
              ) : (
                <p className="not-prose text-sm text-muted-foreground">Your rendered document will appear here.</p>
              )}
            </article>
          )}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>Markdown · GitHub Flavored Markdown supported</span>
          <span aria-live="polite">
            {words.toLocaleString()} {words === 1 ? "word" : "words"} · {value.length.toLocaleString()} characters · about {readingMinutes} min read
            {typeof maxLength === "number" ? ` · ${value.length.toLocaleString()}/${maxLength.toLocaleString()}` : ""}
          </span>
        </footer>
      </section>
      {enableImages && (
        <ImagePickerDialog
          open={pickingImage}
          onOpenChange={setPickingImage}
          onSelect={insertImage}
        />
      )}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="rounded-none">
          <form onSubmit={applyLink} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>Insert link</DialogTitle>
              <DialogDescription>
                Choose the text and a safe web, email, or same-site destination.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`${id ?? "markdown"}-link-label`}>Link text</Label>
              <Input
                id={`${id ?? "markdown"}-link-label`}
                className="rounded-none"
                value={linkLabel}
                onChange={(event) => setLinkLabel(event.target.value)}
                autoFocus
                required
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${id ?? "markdown"}-link-url`}>URL</Label>
              <Input
                id={`${id ?? "markdown"}-link-url`}
                className="rounded-none"
                type="text"
                inputMode="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(event) => {
                  setLinkUrl(event.target.value);
                  setLinkError("");
                }}
                aria-invalid={Boolean(linkError)}
                required
              />
              {linkError && <p className="text-sm text-destructive">{linkError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-none" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-none">Insert link</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={pickingEmoji} onOpenChange={setPickingEmoji}>
        <DialogContent className="w-full max-w-sm rounded-none p-2">
          <DialogHeader className="px-2 pt-2">
            <DialogTitle>Insert emoji</DialogTitle>
            <DialogDescription>Select an emoji to insert at the cursor.</DialogDescription>
          </DialogHeader>
          <EmojiPicker
            colorScheme={resolvedTheme === "dark" ? "dark" : "light"}
            onEmojiClick={insertEmoji}
            width="100%"
            height={380}
            lazyLoadEmojis
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export const MdxEditor = MarkdownEditor;
