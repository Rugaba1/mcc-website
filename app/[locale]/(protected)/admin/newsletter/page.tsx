"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, RefreshCw, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import { MarkdownEditor } from "@/components/admin/mdx-editor";
import { PermissionGate } from "@/components/permission-gate";
import { PERM } from "@/lib/permissions/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormatters } from "@/contexts/format-context";

type NewsletterData = Awaited<ReturnType<typeof api.getAdminNewsletter>>;
type Campaign = NewsletterData["campaigns"][number];

export default function AdminNewsletterPage() {
  const { date } = useFormatters();
  const [data, setData] = useState<NewsletterData | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.getAdminNewsletter());
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not load newsletter data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendBatch(campaign: Campaign, retryFailed = false) {
    setBusyId(campaign.id);
    try {
      const result = await api.sendAdminNewsletterCampaignBatch(campaign.id, retryFailed);
      toast.success(
        `Sent ${result.sent}; ${result.failed} failed; ${result.skipped} skipped; ${result.pending} remain.`,
      );
      await load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not send this campaign batch."));
    } finally {
      setBusyId(null);
    }
  }

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    try {
      const created = await api.createAdminNewsletterCampaign({ subject, bodyMarkdown });
      setSubject("");
      setBodyMarkdown("");
      if (created.recipientCount === 0) {
        toast.info("No confirmed active subscribers are available.");
        await load();
        return;
      }
      toast.success(`Campaign queued for ${created.recipientCount} confirmed subscribers.`);
      await api.sendAdminNewsletterCampaignBatch(created.campaign.id);
      await load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not create or send the campaign."));
      await load();
    } finally {
      setCreating(false);
    }
  }

  const counts = data?.counts ?? {};

  return (
    <PermissionGate required={PERM.NEWSLETTER_MANAGE} mode="message">
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-2xl font-semibold">Newsletter</h1>
            <p className="text-sm text-muted-foreground">
              Manage consented subscribers and send Markdown newsletters.
            </p>
          </div>
          <Button variant="outline" className="rounded-none" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <section className="space-y-4 border p-4">
          <div className="flex items-center gap-2">
            <Users className="size-5" />
            <h2 className="text-lg font-semibold">Subscribers</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Confirmed", counts.ACTIVE ?? 0],
              ["Awaiting confirmation", counts.PENDING ?? 0],
              ["Unsubscribed", counts.UNSUBSCRIBED ?? 0],
              ["Shown below", data?.subscribers.length ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confirmed</TableHead>
                  <TableHead>Subscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !data ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center"><Loader2 className="mr-2 inline size-4 animate-spin" />Loading subscribers…</TableCell></TableRow>
                ) : !data?.subscribers.length ? (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No subscribers yet.</TableCell></TableRow>
                ) : data.subscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>{subscriber.email}</TableCell>
                    <TableCell><Badge variant={subscriber.status === "ACTIVE" ? "default" : "secondary"} className="rounded-none">{subscriber.status.toLowerCase()}</Badge></TableCell>
                    <TableCell>{date(subscriber.confirmedAt)}</TableCell>
                    <TableCell>{date(subscriber.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data && counts.ACTIVE > data.subscribers.filter((subscriber) => subscriber.status === "ACTIVE").length && (
            <p className="text-xs text-muted-foreground">Showing the 50 most recent subscribers.</p>
          )}
        </section>

        <section className="space-y-4 border p-4">
          <div>
            <h2 className="text-lg font-semibold">Compose a campaign</h2>
            <p className="text-sm text-muted-foreground">
              Sent only to confirmed, active subscribers. Delivery is batched in groups of 20; every email includes a personal unsubscribe link.
            </p>
          </div>
          <form onSubmit={createCampaign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newsletter-subject">Subject</Label>
              <Input
                id="newsletter-subject"
                className="rounded-none"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={200}
                minLength={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <MarkdownEditor value={bodyMarkdown} onChange={setBodyMarkdown} enableImages={false} maxLength={50_000} />
            </div>
            <Button type="submit" className="rounded-none" disabled={creating || !bodyMarkdown.trim()}>
              {creating ? <Loader2 className="animate-spin" /> : <Send />}
              {creating ? "Creating campaign…" : "Create campaign & send first batch"}
            </Button>
          </form>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Campaign history</h2>
          <p className="text-xs text-muted-foreground">Showing the 20 most recent campaigns.</p>
          <div className="overflow-x-auto border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.campaigns.length ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No campaigns yet.</TableCell></TableRow>
                ) : data.campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="max-w-xs truncate font-medium">{campaign.subject}</TableCell>
                    <TableCell><Badge variant={campaign.status === "SENT" ? "default" : campaign.status === "PARTIAL" ? "destructive" : "secondary"} className="rounded-none">{campaign.status.toLowerCase()}</Badge></TableCell>
                    <TableCell>{campaign.recipientCount}</TableCell>
                    <TableCell>{date(campaign.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {campaign.status === "QUEUED" && (
                          <Button size="sm" variant="outline" className="rounded-none" disabled={busyId === campaign.id} onClick={() => void sendBatch(campaign)}>
                            {busyId === campaign.id ? <Loader2 className="animate-spin" /> : <Send />}
                            Continue
                          </Button>
                        )}
                        {campaign.status === "PARTIAL" && (
                          <Button size="sm" variant="outline" className="rounded-none" disabled={busyId === campaign.id} onClick={() => void sendBatch(campaign, true)}>
                            {busyId === campaign.id ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                            Retry failed
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </PermissionGate>
  );
}
