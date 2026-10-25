import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withAuth";
import { invoicePath } from "@/lib/invoices/url"; // not "lib/invoices": keeps pdfmake out of this route
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const runtime = "nodejs";

export const GET = withAuth(async (request: NextRequest, { user }) => {
  const pagination = parsePagination(request.nextUrl.searchParams, 10);
  if (!pagination) {
    return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
  }
  const where = { userId: user.id };
  let total = 0;
  let page = pagination.page;
  if (pagination.requested) {
    total = await prisma.order.count({ where });
    page = pageForTotal(total, pagination.page, pagination.pageSize).page;
  }
  const orders = await prisma.order.findMany({
    where,
    orderBy: { placedAt: "desc" },
    ...(pagination.requested
      ? { skip: (page - 1) * pagination.pageSize, take: pagination.pageSize }
      : {}),
    // Prisma allows `select` OR `include`, never both, so invoices go inside select.
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      grandTotal: true,
      currency: true,
      placedAt: true,
      _count: { select: { items: true } },
      invoices: {
        select: { id: true, kind: true, number: true, issuedAt: true },
        orderBy: { issuedAt: "asc" },
      },
    },
  });

  const items = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      grandTotal: Number(o.grandTotal),
      currency: o.currency,
      placedAt: o.placedAt.toISOString(),
      itemCount: o._count.items,
      invoices: o.invoices.map((inv) => ({
        id: inv.id,
        kind: inv.kind,
        number: inv.number,
        issuedAt: inv.issuedAt.toISOString(),
        url: invoicePath(inv.number),
      })),
    }));
  return NextResponse.json(
    pagination.requested
      ? paginatedResult(items, total, page, pagination.pageSize)
      : items,
  );
});
