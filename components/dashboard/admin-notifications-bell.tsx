"use client";

import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { useAdminNotifications } from "@/components/dashboard/admin-notifications-provider";
import { useFormatters } from "@/contexts/format-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const groups = [
  { type: "order", label: "Orders", href: "/admin/orders" },
  { type: "message", label: "Messages", href: "/admin/messages" },
  { type: "review", label: "Reviews", href: "/admin/reviews" },
  { type: "payment", label: "Payments", href: "/admin/payments" },
] as const;

export function AdminNotificationsBell() {
  const {
    notifications,
    unreadCount,
    streamError,
    markRead,
  } = useAdminNotifications();
  const { dateTime } = useFormatters();
  const [open, setOpen] = useState(false);
  const grouped = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: notifications.filter((item) => item.type === group.type),
        }))
        .filter((group) => group.items.length > 0),
    [notifications],
  );

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 min-w-5 justify-center px-1 text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>Recent activity</SheetTitle>
          <SheetDescription>
            {unreadCount} unread event{unreadCount === 1 ? "" : "s"}
          </SheetDescription>
        </SheetHeader>

        {streamError && (
          <p role="alert" className="mx-4 border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
            {streamError}
          </p>
        )}

        {notifications.length > 0 && (
          <div className="px-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void markRead(notifications.map((item) => item.id))
              }
            >
              Mark visible as read
            </Button>
          </div>
        )}

        {grouped.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <div className="space-y-5 px-4 pb-6">
            {grouped.map((group) => (
              <section key={group.type} aria-label={group.label}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={group.href}
                        onClick={() => {
                          void markRead([item.id]);
                          setOpen(false);
                        }}
                        className="block border border-border p-3 transition-colors hover:bg-muted"
                      >
                        <span className="block text-sm font-semibold">
                          {item.title}
                        </span>
                        {item.message && (
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {item.message}
                          </span>
                        )}
                        <time
                          dateTime={item.createdAt}
                          className="mt-2 block text-xs text-muted-foreground"
                        >
                          {dateTime(item.createdAt)}
                        </time>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
