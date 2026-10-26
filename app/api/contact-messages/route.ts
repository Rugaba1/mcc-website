import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import type { Prisma } from "@/lib/generated/prisma/client";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const runtime = "nodejs";

export const GET = withPermission(PERM.MESSAGES_VIEW)(
  async (request: NextRequest) => {
  try {
    const pagination = parsePagination(request.nextUrl.searchParams);
    if (!pagination) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }
    const statusInput = request.nextUrl.searchParams.get("status");
    const statuses = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;
    const status = statuses.find((value) => value === statusInput);
    if (statusInput && !status) {
      return NextResponse.json({ error: "Invalid message status" }, { status: 400 });
    }
    const where: Prisma.ContactMessageWhereInput = {
      ...(status ? { status } : {}),
      ...(pagination.search
        ? {
            OR: [
              { firstName: { contains: pagination.search } },
              { lastName: { contains: pagination.search } },
              { email: { contains: pagination.search } },
              { projectType: { contains: pagination.search } },
              { message: { contains: pagination.search } },
            ],
          }
        : {}),
    };
    let total = 0;
    let page = pagination.page;
    if (pagination.requested) {
      total = await prisma.contactMessage.count({ where });
      page = pageForTotal(total, pagination.page, pagination.pageSize).page;
    }
    const rows = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        emailDeliveries: {
          orderBy: { type: "asc" },
          select: {
            id: true,
            type: true,
            status: true,
            attempts: true,
            lastAttemptAt: true,
            deliveredAt: true,
            lastError: true,
          },
        },
      },
      ...(pagination.requested
        ? { skip: (page - 1) * pagination.pageSize, take: pagination.pageSize }
        : {}),
      omit: { ipHash: true },
    });
    const items = rows.map((r) => ({
      ...r,
      ackSentAt: r.ackSentAt?.toISOString() ?? null,
      repliedAt: r.repliedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      emailDeliveries: r.emailDeliveries.map((delivery) => ({
        ...delivery,
        lastAttemptAt: delivery.lastAttemptAt?.toISOString() ?? null,
        deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
      })),
    }));
    return NextResponse.json(
      pagination.requested
        ? paginatedResult(items, total, page, pagination.pageSize)
        : items,
    );
  } catch (error) {
    console.error("GET /api/contact-messages:", error);
    return NextResponse.json({ error: "Failed to load contact messages" }, { status: 500 });
  }
  },
);
