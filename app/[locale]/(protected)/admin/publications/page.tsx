"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ImageField } from "@/components/file-picker";
import { MediaImage } from "@/components/media-image";
import { MarkdownEditor } from "@/components/admin/mdx-editor";
import { PermissionGate } from "@/components/permission-gate";
import { ShareWidget } from "@/components/share-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, apiErrorMessage, type PublicationDoc } from "@/lib/api";
import { PERM } from "@/lib/permissions/catalog";

type PublicationDraft = Omit<
  PublicationDoc,
  "id" | "slug" | "createdAt" | "updatedAt"
>;

const emptyDraft: PublicationDraft = {
  title: "",
  summary: "",
  contentMarkdown: "",
  coverImage: null,
  fileUrl: null,
  placement: "PUBLIC_PAGE",
  active: false,
  startsAt: null,
  endsAt: null,
};

const placementLabels: Record<PublicationDraft["placement"], string> = {
  NAVBAR: "Top of website",
  HOME_DIALOG: "Homepage dialog",
  PUBLIC_PAGE: "Publications page",
  NAVBAR_AND_PAGE: "Website top + publications page",
  DIALOG_AND_PAGE: "Homepage dialog + publications page",
};

function toDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export default function AdminPublicationsPage() {
  const [publications, setPublications] = useState<PublicationDoc[]>([]);
  const [draft, setDraft] = useState<PublicationDraft>(emptyDraft);
  const [editing, setEditing] = useState<PublicationDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPublications(await api.getAdminPublications());
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not load publications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const beginEdit = (publication: PublicationDoc) => {
    setEditing(publication);
    setDraft({
      title: publication.title,
      summary: publication.summary,
      contentMarkdown: publication.contentMarkdown,
      coverImage: publication.coverImage,
      fileUrl: publication.fileUrl,
      placement: publication.placement,
      active: publication.active,
      startsAt: toDateInput(publication.startsAt) || null,
      endsAt: toDateInput(publication.endsAt) || null,
    });
    document.getElementById("publication-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditing(null);
  };

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...draft,
        title: draft.title.trim(),
        startsAt: fromDateInput(draft.startsAt ?? ""),
        endsAt: fromDateInput(draft.endsAt ?? ""),
      };
      if (editing) {
        await api.updatePublication(editing.id, payload);
        toast.success("Publication updated.");
      } else {
        await api.createPublication(payload);
        toast.success("Publication created.");
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save this publication."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(publication: PublicationDoc) {
    if (!window.confirm(`Delete “${publication.title}”?`)) return;
    try {
      await api.deletePublication(publication.id);
      toast.success("Publication deleted.");
      await load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not delete this publication."));
    }
  }

  return (
    <PermissionGate required={PERM.PUBLICATIONS_MANAGE} mode="message">
      <main className="space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Publications & promotions</h1>
          <p className="text-sm text-muted-foreground">
            Publish announcements, promotion campaigns, and downloadable PDFs with a scheduled placement.
          </p>
        </header>

        <form id="publication-form" onSubmit={save} className="space-y-5 border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{editing ? "Edit publication" : "Create publication"}</h2>
            {editing && <Button type="button" variant="outline" onClick={resetForm}>Cancel edit</Button>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="publication-title">Title</Label>
              <Input id="publication-title" required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Placement</Label>
              <Select
                value={draft.placement}
                onValueChange={(value) => setDraft({ ...draft, placement: value as PublicationDraft["placement"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(placementLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="publication-summary">Summary</Label>
              <Input id="publication-summary" maxLength={500} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cover image</Label>
              <ImageField value={draft.coverImage ?? ""} onChange={(value) => setDraft({ ...draft, coverImage: value || null })} kind="image" />
            </div>
            <div className="space-y-2">
              <Label>PDF / announcement attachment</Label>
              <ImageField value={draft.fileUrl ?? ""} onChange={(value) => setDraft({ ...draft, fileUrl: value || null })} kind="file" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publication-start">Starts at</Label>
              <DateTimePicker
                id="publication-start"
                value={draft.startsAt ?? ""}
                placeholder="Choose start date and time"
                onChange={(value) => setDraft({ ...draft, startsAt: value || null })}
              />
              {draft.startsAt && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraft({ ...draft, startsAt: null })}
                >
                  Clear start schedule
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="publication-end">Ends at</Label>
              <DateTimePicker
                id="publication-end"
                value={draft.endsAt ?? ""}
                placeholder="Choose end date and time"
                onChange={(value) => setDraft({ ...draft, endsAt: value || null })}
              />
              {draft.endsAt && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraft({ ...draft, endsAt: null })}
                >
                  Clear end schedule
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="publication-active" checked={draft.active} onCheckedChange={(checked) => setDraft({ ...draft, active: checked === true })} />
              <Label htmlFor="publication-active">Active during the selected schedule</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Publication content</Label>
              <MarkdownEditor value={draft.contentMarkdown} onChange={(contentMarkdown) => setDraft({ ...draft, contentMarkdown })} maxLength={100_000} />
            </div>
          </div>
          <Button type="submit" disabled={saving || !draft.title.trim()}>
            {editing ? "Save changes" : <><Plus /> Create publication</>}
          </Button>
        </form>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">All publications</h2>
          <div className="overflow-x-auto border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Publication</TableHead>
                  <TableHead>Placement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center">Loading publications…</TableCell></TableRow>
                ) : publications.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No publications yet.</TableCell></TableRow>
                ) : publications.map((publication) => (
                  <TableRow key={publication.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {publication.coverImage && (
                          <div className="relative size-12 shrink-0">
                            <MediaImage src={publication.coverImage} alt="" fill sizes="3rem" className="object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{publication.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{publication.summary}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{placementLabels[publication.placement]}</TableCell>
                    <TableCell><Badge variant={publication.active ? "default" : "secondary"}>{publication.active ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {publication.active && <ShareWidget title={publication.title} text={publication.summary} path={`/publications/${publication.slug}`} iconOnly />}
                        <Button type="button" size="icon" variant="outline" aria-label={`Edit ${publication.title}`} onClick={() => beginEdit(publication)}><Pencil /></Button>
                        <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${publication.title}`} onClick={() => void remove(publication)}><Trash2 /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
    </PermissionGate>
  );
}
