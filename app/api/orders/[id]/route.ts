import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { invoicePath, issueInvoiceSafely } from "@/lib/invoices/invoice";
import { sendOrderStatusEmail } from "@/lib/email";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withPermission(PERM.ORDERS_VIEW)(
  async (_req: NextRequest, context) => {
  try {
    const id = Number((await context.params!).id);
    if (!Number.isSafeInteger(id) || id < 1)
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        items: true,
        payments: true,
        history: {
          orderBy: { createdAt: "desc" },
          include: {
            changedBy: { select: { firstName: true, lastName: true } },
          },
        },
        invoices: {
          select: { id: true, kind: true, number: true, issuedAt: true },
          orderBy: { issuedAt: "asc" },
        },
      },
    });
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({
      ...order,
      customerName: order.user
        ? `${order.user.firstName} ${order.user.lastName ?? ""}`.trim()
        : (order.shipFullName ?? order.guestEmail ?? "Guest"),
      email: order.user?.email ?? order.guestEmail ?? null,
      phone: order.user?.phoneNumber ?? order.guestPhone ?? null,
      itemCount: order.items.length,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      shippingFee: Number(order.shippingFee),
      taxTotal: Number(order.taxTotal),
      grandTotal: Number(order.grandTotal),
      items: order.items.map((item) => ({
        ...item,
        sqmPerBox: Number(item.sqmPerBox),
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
      payments: order.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
      invoices: order.invoices.map((inv) => ({
        id: inv.id,
        kind: inv.kind,
        number: inv.number,
        issuedAt: inv.issuedAt,
        url: inv.number ? invoicePath(inv.number) : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/orders/[id]:", error);
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 },
    );
  }
  },
);

export const PUT = withPermission(PERM.ORDERS_UPDATE_STATUS)(
  async (req: NextRequest, context) => {
  try {
    const id = Number((await context.params!).id);
    if (!Number.isSafeInteger(id) || id < 1)
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const hasStatus = Object.hasOwn(data, "status");
    const hasNote = Object.hasOwn(data, "internalNote");
    if (!hasStatus && !hasNote)
      return NextResponse.json(
        { error: "No editable fields provided" },
        { status: 400 },
      );
    if (
      hasStatus &&
      (typeof data.status !== "string" ||
        !ORDER_STATUSES.includes(
          data.status as (typeof ORDER_STATUSES)[number],
        ))
    ) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 },
      );
    }
    if (
      hasNote &&
      data.internalNote !== null &&
      (typeof data.internalNote !== "string" || data.internalNote.length > 5000)
    ) {
      return NextResponse.json(
        { error: "Internal note must be 5000 characters or fewer" },
        { status: 400 },
      );
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        orderNumber: true,
        guestEmail: true,
        shipFullName: true,
        user: { select: { email: true, firstName: true } },
      },
    });
    if (!existing)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const status = hasStatus
      ? (data.status as (typeof ORDER_STATUSES)[number])
      : undefined;
    const now = new Date();
    const updateData = {
      ...(status ? { status } : {}),
      ...(hasNote ? { internalNote: data.internalNote as string | null } : {}),
      ...(status === "PAID"
        ? { paymentStatus: "PAID" as const, paidAt: now }
        : {}),
      ...(status === "SHIPPED" ? { shippedAt: now } : {}),
      ...(status === "DELIVERED" ? { deliveredAt: now } : {}),
      ...(status === "CANCELLED" ? { cancelledAt: now } : {}),
    };

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: updateData });
      if (status === "PAID") {
        await tx.payment.updateMany({
          where: { orderId: id, status: "PENDING" },
          data: { status: "PAID", paidAt: now, recordedById: context.user.id },
        });
      }
      if (status && status !== existing.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status,
            changedById: context.user.id,
            note: `Status changed from ${existing.status} to ${status}`,
          },
        });
      }
    });

    const updated = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, internalNote: true },
    });
    if (!updated)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    await issueInvoiceSafely(updated.id);
    if (status && status !== existing.status) {
      const email = existing.user?.email ?? existing.guestEmail;
      if (email) {
        await sendOrderStatusEmail({
          to: email,
          firstName:
            existing.user?.firstName ??
            existing.shipFullName?.split(/\s+/)[0] ??
            "Customer",
          orderNumber: existing.orderNumber,
          status,
        });
      }
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/orders/[id]:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 },
    );
  }
});
