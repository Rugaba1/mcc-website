"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, ShieldBan, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { api, apiErrorMessage, type BlockableUser, type BlockedEmail } from "@/lib/api";
import { PERM } from "@/lib/permissions/catalog";
import { PermissionGate } from "@/components/permission-gate";
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

function BlockedEmailsContent() {
  const { date } = useFormatters();
  const [entries, setEntries] = useState<BlockedEmail[]>([]);
  const [email, setEmail] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<BlockableUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<BlockableUser | null>(null);
  const [manualEmail, setManualEmail] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await api.getBlockedEmails());
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not load blocked emails."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (manualEmail || selectedUser || userQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      api.searchBlockableUsers(userQuery.trim())
        .then(({ users }) => {
          if (active) setUserResults(users);
        })
        .catch((error) => {
          if (active) {
            setUserResults([]);
            toast.error(apiErrorMessage(error, "Could not search users."));
          }
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [manualEmail, selectedUser, userQuery]);

  async function addBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await api.createBlockedEmail({
        ...(manualEmail ? { email } : selectedUser ? { userId: selectedUser.id } : {}),
        reason,
      });
      setEmail("");
      setUserQuery("");
      setSelectedUser(null);
      setReason("");
      toast.success(
        `Email blocked. ${response.disabledAccounts} matching account(s) disabled.`,
      );
      await load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not block this email."));
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock(entry: BlockedEmail) {
    if (
      !window.confirm(
        `Remove the block for ${entry.email}? Disabled accounts will remain inactive until re-enabled separately.`,
      )
    ) {
      return;
    }

    setRemovingId(entry.id);
    try {
      await api.deactivateBlockedEmail(entry.id);
      toast.success("Email block removed. Accounts were not reactivated.");
      await load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not remove this email block."));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Blocked email addresses</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Blocking an address prevents signup and sign-in and disables existing
          accounts using that normalized address. Removing a block does not
          reactivate those accounts. Entries remain when a user account is
          deleted.
        </p>
      </header>

      <form onSubmit={addBlock} className="grid gap-4 border p-4 sm:grid-cols-2">
        <div className="space-y-2">
          {manualEmail ? (
            <>
              <Label htmlFor="blocked-email">Email address</Label>
              <Input
                id="blocked-email"
                name="email"
                type="email"
                autoComplete="off"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button type="button" variant="link" className="h-auto px-0" onClick={() => setManualEmail(false)}>
                Search existing users instead
              </Button>
            </>
          ) : (
            <>
              <Label htmlFor="blocked-user-search">Find a user by name or email</Label>
              {selectedUser ? (
                <div className="flex items-center justify-between gap-3 border p-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{selectedUser.name || selectedUser.email}</span>
                    <span className="block truncate text-xs text-muted-foreground">{selectedUser.email}</span>
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
                </div>
              ) : (
                <>
                  <Input
                    id="blocked-user-search"
                    autoComplete="off"
                    value={userQuery}
                    placeholder="Type at least two characters"
                    onChange={(event) => setUserQuery(event.target.value)}
                  />
                  {userResults.length > 0 && (
                    <ul className="max-h-48 overflow-y-auto border">
                      {userResults.map((user) => (
                        <li key={user.id}>
                          <button
                            type="button"
                            className="w-full border-b p-3 text-left text-sm last:border-0 hover:bg-muted"
                            onClick={() => { setSelectedUser(user); setUserQuery(""); }}
                          >
                            <span className="block font-medium">{user.name || user.email}</span>
                            <span className="block text-xs text-muted-foreground">{user.email} · {user.active ? "Active" : "Inactive"}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              <Button type="button" variant="link" className="h-auto px-0" onClick={() => { setManualEmail(true); setSelectedUser(null); setUserQuery(""); }}>
                Enter a different email address
              </Button>
            </>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="block-reason">Reason (optional)</Label>
          <Input
            id="block-reason"
            name="reason"
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving || (!manualEmail && !selectedUser)}>
            {saving ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ShieldBan className="mr-2 size-4" />
            )}
            Block email
          </Button>
        </div>
      </form>

      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No blocklist entries.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.email}</TableCell>
                  <TableCell>{entry.reason || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={entry.isActive ? "destructive" : "secondary"}>
                      {entry.isActive ? "Blocked" : "Removed"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {date(entry.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.isActive && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={removingId === entry.id}
                        onClick={() => void removeBlock(entry)}
                        aria-label={`Remove block for ${entry.email}`}
                      >
                        {removingId === entry.id ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Undo2 className="mr-2 size-4" />
                        )}
                        Remove block
                      </Button>
                    )}
                    {!entry.isActive && entry.revokedAt && (
                      <span className="text-xs text-muted-foreground">
                        Removed {date(entry.revokedAt)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}

export default function BlockedEmailsPage() {
  return (
    <PermissionGate required={PERM.USERS_PERMISSIONS} mode="message">
      <BlockedEmailsContent />
    </PermissionGate>
  );
}
