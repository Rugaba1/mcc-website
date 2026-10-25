"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  api,
  apiErrorMessage,
  refreshAccessToken,
  type AdminNotification,
  type AdminNotificationSummary,
} from "@/lib/api";
import { tokenStore } from "@/lib/token-store";
import { useAuth } from "@/contexts/auth-context";
import { hasAnyPermission } from "@/lib/permissions/core";
import { PERM } from "@/lib/permissions/catalog";

type NotificationCounts = Pick<
  AdminNotificationSummary,
  "unreadCount" | "unreadMessageCount"
>;

type NotificationContextValue = {
  notifications: AdminNotification[];
  unreadCount: number;
  unreadMessageCount: number;
  streamError: string | null;
  markRead: (ids: number[]) => Promise<void>;
};

const emptySummary: AdminNotificationSummary = {
  notifications: [],
  unreadCount: 0,
  unreadMessageCount: 0,
  latestId: 0,
};

const AdminNotificationsContext =
  createContext<NotificationContextValue | null>(null);

const notificationPermissions = [
  PERM.ORDERS_VIEW,
  PERM.MESSAGES_VIEW,
  PERM.REVIEWS_MODERATE,
  PERM.PAYMENTS_VIEW,
] as const;

export function AdminNotificationsProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState(emptySummary);
  const [streamError, setStreamError] = useState<string | null>(null);
  const canView = Boolean(
    user && hasAnyPermission(user.permissions, notificationPermissions),
  );

  const markRead = useCallback(
    async (ids: number[]) => {
      if (!ids.length) return;
      try {
        const result = await api.markAdminNotificationsRead(ids);
        setSummary((current) => ({
          ...current,
          notifications: current.notifications.filter(
            (notification) => !ids.includes(notification.id),
          ),
          unreadCount: Math.max(0, current.unreadCount - result.markedRead),
        }));
      } catch (error) {
        toast.error(apiErrorMessage(error, "Could not update notifications."));
      }
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !canView || !token) {
      setSummary(emptySummary);
      setStreamError(null);
      return;
    }

    let active = true;
    let reconnectTimer: number | undefined;
    let lastId = 0;
    let retryCount = 0;
    const controller = new AbortController();
    const decoder = new TextDecoder();

    const applyCounts = (counts: NotificationCounts) => {
      setSummary((current) => ({ ...current, ...counts }));
    };

    const consumeStream = async () => {
      try {
        while (active) {
          const accessToken = tokenStore.get()?.accessToken;
          if (!accessToken) {
            await refreshAccessToken();
          }
          const currentToken = tokenStore.get()?.accessToken;
          if (!currentToken) throw new Error("Admin session is no longer available.");

          const response = await fetch(
            `/api/admin/notifications/stream?after=${lastId}`,
            {
              headers: { Authorization: `Bearer ${currentToken}` },
              cache: "no-store",
              signal: controller.signal,
            },
          );
          if (!response.ok || !response.body) {
            if (response.status === 401) {
              await refreshAccessToken();
              throw new Error("Session refreshed; reconnecting notifications.");
            }
            throw new Error(`Notification stream returned HTTP ${response.status}.`);
          }

          retryCount = 0;
          setStreamError(null);
          const reader = response.body.getReader();
          let buffer = "";
          while (active) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let boundary = /\r?\n\r?\n/.exec(buffer);
            while (boundary) {
              const frame = buffer.slice(0, boundary.index);
              buffer = buffer.slice(boundary.index + boundary[0].length);
              let event = "message";
              const dataLines: string[] = [];
              for (const line of frame.split(/\r?\n/)) {
                if (line.startsWith("event:")) event = line.slice(6).trim();
                if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
                if (line.startsWith("id:")) {
                  const id = Number(line.slice(3).trim());
                  if (Number.isSafeInteger(id)) lastId = Math.max(lastId, id);
                }
              }
              const data = dataLines.join("\n");
              if (event === "notification" && data) {
                const notification = JSON.parse(data) as AdminNotification;
                setSummary((current) => ({
                  ...current,
                  notifications: [
                    notification,
                    ...current.notifications.filter(
                      (item) => item.id !== notification.id,
                    ),
                  ].slice(0, 20),
                }));
              } else if (event === "snapshot" && data) {
                setSummary(JSON.parse(data) as AdminNotificationSummary);
              } else if (event === "counts" && data) {
                applyCounts(JSON.parse(data) as NotificationCounts);
              }
              boundary = /\r?\n\r?\n/.exec(buffer);
            }
          }
        }
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        retryCount += 1;
        const message =
          error instanceof Error
            ? error.message
            : "Notification stream disconnected.";
        if (retryCount >= 3) {
          setStreamError(`${message} Reconnecting…`);
          console.error("Admin notification stream disconnected:", error);
        }
        reconnectTimer = window.setTimeout(
          () => void consumeStream(),
          Math.min(1_000 * 2 ** Math.min(retryCount, 5), 30_000),
        );
      }
    };

    void consumeStream();
    return () => {
      active = false;
      controller.abort();
      if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
    };
  }, [canView, enabled, token]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications: summary.notifications,
      unreadCount: summary.unreadCount,
      unreadMessageCount: summary.unreadMessageCount,
      streamError,
      markRead,
    }),
    [markRead, streamError, summary],
  );

  return (
    <AdminNotificationsContext.Provider value={value}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  if (!context) {
    throw new Error(
      "useAdminNotifications must be used inside AdminNotificationsProvider.",
    );
  }
  return context;
}
