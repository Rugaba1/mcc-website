"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage, type ContactMessage, type ContactStatus } from "@/lib/api";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input, Label, Select, Textarea } from "../fields";
import { Modal } from "../modal";
import { useFormatters } from "@/contexts/format-context";

const STATUSES: ContactStatus[] = ["NEW", "READ", "REPLIED", "ARCHIVED"];

export function MessagesSection({
  messages,
  reload,
}: {
  messages: ContactMessage[];
  reload: () => void;
}) {
  const { dateTime } = useFormatters();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | ContactStatus>("ALL");
  const [open, setOpen] = useState<ContactMessage | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const visible = messages.filter(
    (m) =>
      (filter === "ALL" || m.status === filter) &&
      `${m.firstName} ${m.lastName} ${m.email} ${m.message}`.toLowerCase().includes(search.toLowerCase()),
  );

  async function view(m: ContactMessage) {
    setOpen(m);
    setReply("");
    if (m.status === "NEW") {
      try {
        await api.updateContactStatus(m.id, "READ");
        reload();
      } catch {
        /* non-critical */
      }
    }
  }

  async function setStatus(m: ContactMessage, status: ContactStatus) {
    try {
      await api.updateContactStatus(m.id, status);
      setOpen({ ...m, status });
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Update failed"));
    }
  }

  async function send() {
    if (!open) return;
    setSending(true);
    try {
      await api.replyContact(open.id, reply);
      toast.success(`Reply sent to ${open.email}`);
      setOpen(null);
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not send reply"));
    } finally {
      setSending(false);
    }
  }

  async function remove(m: ContactMessage) {
    if (!confirm("Delete this message permanently?")) return;
    try {
      await api.deleteContactMessage(m.id);
      toast.success("Deleted");
      setOpen(null);
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Delete failed"));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Messages</h2>
          <p className="text-sm text-muted-foreground">
            {messages.length} total · {messages.filter((m) => m.status === "NEW").length} new
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input aria-label="Search messages" placeholder="Search name, email, text" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-64" />
          <Select aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value as "ALL" | ContactStatus)} className="sm:w-40">
            <option value="ALL">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left">
              {["Received", "From", "Project", "Message", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase">{h}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((m) => (
              <tr key={m.id} className={`hover:bg-muted/40 ${m.status === "NEW" ? "font-semibold" : ""}`}>
                <td className="px-4 py-3 text-muted-foreground">{dateTime(m.createdAt)}</td>
                <td className="px-4 py-3">
                  <p>{m.firstName} {m.lastName}</p>
                  <p className="text-xs font-normal text-muted-foreground">{m.email}</p>
                </td>
                <td className="px-4 py-3">{m.projectType ?? "—"}</td>
                <td className="max-w-xs truncate px-4 py-3 font-normal text-muted-foreground">{m.message}</td>
                <td className="px-4 py-3">
                  <Badge variant={m.status === "NEW" ? "default" : "outline"}>{m.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => void view(m)}>Open</Button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No messages.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal
          title={`${open.firstName} ${open.lastName}`}
          maxWidth="max-w-2xl"
          onClose={() => setOpen(null)}
          onSave={() => void send()}
          saving={sending}
          saveLabel="Send reply by email"
          saveDisabled={!reply.trim()}
        >
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <a className="text-primary hover:underline" href={`mailto:${open.email}`}>{open.email}</a>
              {open.phone && <> · <a className="hover:underline" href={`tel:${open.phone}`}>{open.phone}</a></>}
            </p>
            <p>
              {dateTime(open.createdAt)}
              {open.projectType && ` · ${open.projectType}`}
              {" · "}acknowledgement {open.ackSentAt ? "sent" : "not sent"}
            </p>
          </div>

          <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">{open.message}</p>

          {open.replyText && (
            <div>
              <Label>Previous reply · {open.repliedAt && dateTime(open.repliedAt)}</Label>
              <p className="whitespace-pre-wrap rounded-lg border border-border p-4 text-sm">{open.replyText}</p>
            </div>
          )}

          <div>
            <Label>{open.replyText ? "Send another reply" : "Reply"}</Label>
            <Textarea rows={5} maxLength={5000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Hi ${open.firstName}, …`} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {open.status !== "ARCHIVED" ? (
              <Button variant="outline" size="sm" onClick={() => void setStatus(open, "ARCHIVED")}>Archive</Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => void setStatus(open, "READ")}>Restore</Button>
            )}
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => void remove(open)}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}