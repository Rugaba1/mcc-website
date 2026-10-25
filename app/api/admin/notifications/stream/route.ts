import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";
import { expandPermissions, hasAnyPermission } from "@/lib/permissions/core";
import { PERM } from "@/lib/permissions/catalog";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventPermissions = [
  PERM.ORDERS_VIEW,
  PERM.MESSAGES_VIEW,
  PERM.REVIEWS_MODERATE,
  PERM.PAYMENTS_VIEW,
] as const;

function allowedPermissions(granted: string[]) {
  const effective = expandPermissions(granted);
  if (effective.has(PERM.ADMIN)) return [...eventPermissions];
  return eventPermissions.filter((permission) => effective.has(permission));
}

export const GET = withAuth(async (request: NextRequest, { user }) => {
  if (!hasAnyPermission(user.permissions, eventPermissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const permissions = allowedPermissions(user.permissions);
  const requestedAfter = Number(request.nextUrl.searchParams.get("after") ?? 0);
  let lastId = Number.isSafeInteger(requestedAfter) && requestedAfter > 0
    ? requestedAfter
    : 0;
  let initialPoll = true;

  let closeStream = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      let polling = false;
      let pollTimer: ReturnType<typeof setInterval>;
      let heartbeatTimer: ReturnType<typeof setInterval>;
      let maxAgeTimer: ReturnType<typeof setTimeout>;
      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        clearTimeout(maxAgeTimer);
        request.signal.removeEventListener("abort", close);
        try {
          controller.close();
        } catch {
          // The client may already have cancelled the stream.
        }
      };
      const send = (event: string, data: unknown, id?: number) => {
        if (closed) return;
        const idLine = id === undefined ? "" : `id: ${id}\n`;
        controller.enqueue(
          encoder.encode(`${idLine}event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };
      const poll = async () => {
        if (closed || polling) return;
        polling = true;
        try {
          const baseWhere = { requiredPermission: { in: permissions } };
          const unreadWhere = {
            ...baseWhere,
            reads: { none: { userId: user.id } },
          };
          const unreadMessageCountPromise = permissions.includes(
            PERM.MESSAGES_VIEW,
          )
            ? prisma.contactMessage.count({ where: { status: "NEW" } })
            : Promise.resolve(0);

          if (initialPoll) {
            initialPoll = false;
            const [notifications, unreadCount, unreadMessageCount] =
              await Promise.all([
                prisma.adminNotification.findMany({
                  where: unreadWhere,
                  select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    targetPath: true,
                    entityId: true,
                    createdAt: true,
                  },
                  orderBy: { id: "desc" },
                  take: 20,
                }),
                prisma.adminNotification.count({ where: unreadWhere }),
                unreadMessageCountPromise,
              ]);
            lastId = Math.max(lastId, notifications[0]?.id ?? 0);
            send(
              "snapshot",
              {
                notifications,
                unreadCount,
                unreadMessageCount,
                latestId: lastId,
              },
              lastId,
            );
          } else {
            const [fresh, unreadCount, unreadMessageCount] = await Promise.all([
              prisma.adminNotification.findMany({
                where: {
                  ...unreadWhere,
                  id: { gt: lastId },
                },
                select: {
                  id: true,
                  type: true,
                  title: true,
                  message: true,
                  targetPath: true,
                  entityId: true,
                  createdAt: true,
                },
                orderBy: { id: "asc" },
                take: 20,
              }),
              prisma.adminNotification.count({ where: unreadWhere }),
              unreadMessageCountPromise,
            ]);

            for (const notification of fresh) {
              lastId = notification.id;
              send("notification", notification, notification.id);
            }
            send("counts", { unreadCount, unreadMessageCount });
          }
        } catch (error) {
          console.error("Admin notification stream polling failed:", error);
          close();
        } finally {
          polling = false;
        }
      };

      pollTimer = setInterval(() => void poll(), 5_000);
      heartbeatTimer = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15_000);
      maxAgeTimer = setTimeout(close, 30_000);
      request.signal.addEventListener("abort", close, { once: true });
      void poll();
      closeStream = close;
    },
    cancel() {
      closeStream();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
