"use client";

import { useCallback, useEffect, useState } from "react";
import { FilePlus2, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage, type LegalVersion } from "@/lib/api";
import { LEGAL_DOCUMENTS, type LegalDocumentType } from "@/lib/legal/constants";
import { MarkdownEditor } from "@/components/admin/mdx-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFormatters } from "@/contexts/format-context";

type Locale = "en" | "fr" | "rw";
type Draft = Pick<
  LegalVersion,
  "documentType" | "title" | "titleFr" | "titleRw" |
  "contentMarkdown" | "contentMarkdownFr" | "contentMarkdownRw"
>;

const emptyDraft = (documentType: LegalDocumentType): Draft => ({
  documentType,
  title: "",
  titleFr: "",
  titleRw: "",
  contentMarkdown: "",
  contentMarkdownFr: "",
  contentMarkdownRw: "",
});

const locales: Array<{
  id: Locale;
  label: string;
  titleField: "title" | "titleFr" | "titleRw";
  contentField: "contentMarkdown" | "contentMarkdownFr" | "contentMarkdownRw";
}> = [
  { id: "en", label: "English", titleField: "title", contentField: "contentMarkdown" },
  { id: "fr", label: "French", titleField: "titleFr", contentField: "contentMarkdownFr" },
  { id: "rw", label: "Kinyarwanda", titleField: "titleRw", contentField: "contentMarkdownRw" },
];

const documentLabel = (type: LegalDocumentType) =>
  LEGAL_DOCUMENTS.find((document) => document.type === type)?.label ?? type;

export default function AdminLegalPage() {
  const { date } = useFormatters();
  const [versions, setVersions] = useState<LegalVersion[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft(LEGAL_DOCUMENTS[0].type));
  const [draftId, setDraftId] = useState<number | null>(null);
  const [activeLocale, setActiveLocale] = useState<Locale>("en");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [viewingPublished, setViewingPublished] = useState(false);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminLegalVersions();
      setVersions(data.versions);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not load legal document versions."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  function startNewVersion(documentType: LegalDocumentType) {
    const latest = versions.find((item) => item.documentType === documentType);
    setDraft(latest ? {
      documentType,
      title: latest.title,
      titleFr: latest.titleFr,
      titleRw: latest.titleRw,
      contentMarkdown: latest.contentMarkdown,
      contentMarkdownFr: latest.contentMarkdownFr,
      contentMarkdownRw: latest.contentMarkdownRw,
    } : emptyDraft(documentType));
    setDraftId(null);
    setViewingPublished(false);
    setActiveLocale("en");
    setDirty(true);
  }

  function editVersion(version: LegalVersion) {
    setDraft({
      documentType: version.documentType,
      title: version.title,
      titleFr: version.titleFr,
      titleRw: version.titleRw,
      contentMarkdown: version.contentMarkdown,
      contentMarkdownFr: version.contentMarkdownFr,
      contentMarkdownRw: version.contentMarkdownRw,
    });
    setDraftId(version.id);
    setViewingPublished(Boolean(version.publishedAt));
    setActiveLocale("en");
    setDirty(false);
  }

  function updateDraft(field: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setDirty(true);
  }

  async function saveDraft() {
    setBusy(true);
    try {
      if (draftId) {
        await api.updateLegalDraft(draftId, draft);
      } else {
        const data = await api.createLegalDraft(draft);
        setDraftId(data.version.id);
      }
      setDirty(false);
      toast.success("Draft saved");
      await loadVersions();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save the legal document draft."));
    } finally {
      setBusy(false);
    }
  }

  async function publishDraft() {
    if (!draftId || dirty) return;
    setBusy(true);
    try {
      await api.publishLegalVersion(draftId);
      toast.success("Legal document version published");
      await loadVersions();
      setViewingPublished(true);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not publish this version."));
    } finally {
      setBusy(false);
    }
  }

  const activeFields = locales.find((locale) => locale.id === activeLocale)!;
  const selectedDocument = versions.find((version) => version.id === draftId);
  const readOnly = viewingPublished || Boolean(selectedDocument?.publishedAt);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-bold">Legal documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft, publish, and retain immutable, versioned terms and privacy notices.
          </p>
        </div>
        <Select onValueChange={(value) => startNewVersion(value as LegalDocumentType)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Create next version" />
          </SelectTrigger>
          <SelectContent>
            {LEGAL_DOCUMENTS.map((document) => (
              <SelectItem key={document.type} value={document.type}>
                {document.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <section aria-label="Legal document versions" className="overflow-x-auto border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading versions…</TableCell></TableRow>
            ) : versions.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No versions created.</TableCell></TableRow>
            ) : versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell>{documentLabel(version.documentType)}</TableCell>
                <TableCell>{version.version}</TableCell>
                <TableCell>{version.publishedAt ? "Published" : "Draft"}</TableCell>
                <TableCell>{date(version.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => editVersion(version)}>
                    {version.publishedAt ? "View" : "Edit draft"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="space-y-5 border p-4 sm:p-6">
        <h2 className="text-xl font-semibold">
          {draftId ? `${documentLabel(draft.documentType)} version ${selectedDocument?.version ?? ""}` : `New ${documentLabel(draft.documentType)} version`}
        </h2>
        <div className="max-w-sm space-y-2">
          <Label htmlFor="legal-locale">Language</Label>
          <Select value={activeLocale} onValueChange={(value) => setActiveLocale(value as Locale)}>
            <SelectTrigger id="legal-locale"><SelectValue /></SelectTrigger>
            <SelectContent>
              {locales.map((locale) => <SelectItem key={locale.id} value={locale.id}>{locale.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="legal-title">Document title ({activeFields.label})</Label>
          <Input
            id="legal-title"
            value={draft[activeFields.titleField]}
            onChange={(event) => updateDraft(activeFields.titleField, event.target.value)}
            maxLength={255}
            disabled={readOnly}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="legal-markdown">Markdown ({activeFields.label})</Label>
          <MarkdownEditor
            id="legal-markdown"
            value={draft[activeFields.contentField]}
            onChange={(value) => updateDraft(activeFields.contentField, value)}
            maxLength={100_000}
            disabled={readOnly}
            enableImages={false}
          />
          <p id="legal-markdown-help" className="text-sm text-muted-foreground">
            Markdown only; raw HTML is not rendered. Complete all three languages before publishing.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => void saveDraft()} disabled={busy || readOnly || !dirty}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save draft
          </Button>
          <Button type="button" onClick={() => void publishDraft()} disabled={busy || readOnly || !draftId || dirty}>
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
            Publish version
          </Button>
          {!draftId && <span className="inline-flex items-center text-sm text-muted-foreground"><FilePlus2 className="mr-2 size-4" />Save to create a version</span>}
        </div>
      </section>
    </div>
  );
}
