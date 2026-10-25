"use client";

import { useEffect, useState } from "react";
import { Archive, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type ContactMessage } from "@/lib/api";
import { Link } from "@/app/i18n/routing";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { useAuth } from "@/contexts/auth-context";
import { hasPermissions } from "@/lib/permissions/core";
import { ResourcePage } from "@/components/admin/resource-page";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { options } from "@/lib/format";
import { useFormatters } from "@/contexts/format-context";

function MessageView({ row, reload }: { row: ContactMessage; reload: () => Promise<void> }) {
  const { dateTime } = useFormatters();
  const { user } = useAuth();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const orderRequest = /^\[ORDER_REQUEST:(CANCEL|REFUND):(\d+)\]\r?\nOrder: ([^\r\n]+)\r?\n\r?\nCustomer request:\r?\n([\s\S]*)$/.exec(row.message);

  // Opening a new message marks it as read
  useEffect(() => {
    setReply("");
    if (row.status === "NEW" && user && hasPermissions(user.permissions, PERM.MESSAGES_MANAGE)) {
      api.updateContactStatus(row.id, "READ").then(reload).catch((e) => {
        toast.error(apiErrorMessage(e, "Could not mark the message as read"));
      });
    }
  }, [row.id, row.status, user, reload]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); await reload(); }
    catch (e) { toast.error(apiErrorMessage(e, "Something went wrong")); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-sm">
        <p className="font-semibold">{row.firstName} {row.lastName}</p>
        <p><a className="underline" href={`mailto:${row.email}`}>{row.email}</a>{row.phone ? ` · ${row.phone}` : ""}</p>
        <p className="text-muted-foreground">{row.projectType ?? "General enquiry"} · {dateTime(row.createdAt)}</p>
      </div>
      {orderRequest && (
        <div className="flex flex-wrap items-center justify-between gap-3 border bg-muted/40 p-4">
          <div>
            <p className="font-medium">{orderRequest[1] === "CANCEL" ? "Order cancellation request" : "Refund request"}</p>
            <p className="text-sm text-muted-foreground">{orderRequest[3]}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/orders/${orderRequest[2]}`}>Review order</Link>
          </Button>
        </div>
      )}
      <p className="whitespace-pre-wrap border bg-muted/40 p-4 text-sm">
        {orderRequest ? orderRequest[4] : row.message}
      </p>

      {row.replyText && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Your reply, sent {dateTime(row.repliedAt)}</p>
          <p className="whitespace-pre-wrap border-l-2 border-primary pl-3 text-sm">{row.replyText}</p>
        </div>
      )}

      <div className="space-y-2 border-t pt-4">
        <Label>{row.replyText ? "Send another reply" : "Reply by email"}</Label>
        <Textarea className="min-h-32 rounded-none" value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Hi ${row.firstName}, …`} />
        <div className="flex flex-wrap gap-2">
          <PermissionGate required={PERM.MESSAGES_REPLY}>
            <Button className="rounded-none" disabled={busy || !reply.trim()} onClick={() => run(async () => { await api.replyContact(row.id, reply.trim()); setReply(""); }, "Reply sent")}>
              {busy ? <Loader2 className="animate-spin" /> : <Send />} Send reply
            </Button>
          </PermissionGate>
          {row.status !== "ARCHIVED" && (
            <PermissionGate required={PERM.MESSAGES_MANAGE}>
              <Button variant="outline" className="rounded-none" disabled={busy} onClick={() => run(() => api.updateContactStatus(row.id, "ARCHIVED"), "Archived")}><Archive /> Archive</Button>
            </PermissionGate>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminMessagesPage() {
  const { date, dateTime } = useFormatters();
  return (
    <ResourcePage<ContactMessage>
      title="Messages"
      description="Contact enquiries and customer order cancellation or refund requests. Reply to customers here and review linked orders."
      entityName="message"
      loadPage={api.getContactMessagesPage}
      deletePermission={PERM.MESSAGES_MANAGE}
      filters={[{ key: "status", label: "Statuses", options: options(["NEW", "READ", "REPLIED", "ARCHIVED"]) }]}
      columns={[
        { header: "From", cell: (m) => <div><p className={m.status === "NEW" ? "font-semibold" : "font-medium"}>{m.firstName} {m.lastName}</p><p className="text-xs text-muted-foreground">{m.email}</p></div> },
        { header: "Project", cell: (m) => m.projectType ?? "—" },
        { header: "Message", cell: (m) => <p className="max-w-sm truncate text-muted-foreground">{m.message}</p> },
        { header: "Status", cell: (m) => <StatusBadge status={m.status} /> },
        { header: "Received", cell: (m) => date(m.createdAt) },
      ]}
      remove={(m) => api.deleteContactMessage(m.id)}
      deleteWarning={(m) => `The message from ${m.firstName} ${m.lastName} will be permanently deleted.`}
      detail={{ title: (m) => `${m.firstName} ${m.lastName}`, description: (m) => m.email, render: (m, { reload }) => <MessageView row={m} reload={reload} /> }}
    />
  );
}