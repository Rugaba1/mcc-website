import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { invoicePath, issueInvoiceSafely } from "@/lib/invoices/invoice";
import { sendOrderStatusEmail } from "@/lib/email";
import {
  canTransitionOrderStatus,
  orderStatusDateField,
  orderStatusDateLabel,
  type OrderStatus,
} from "@/lib/orders/status";

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
    const paidAt =
      typeof data.paidAt === "string" ? data.paidAt : undefined;
    const statusAt =
      typeof data.statusAt === "string" ? data.statusAt : undefined;
    const eventAt = statusAt ?? paidAt;
    const statusDate = eventAt ? new Date(eventAt) : null;
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
    if (
      Object.hasOwn(data, "paidAt") &&
      (typeof data.paidAt !== "string" ||
        Number.isNaN(new Date(data.paidAt).getTime()))
    ) {
      return NextResponse.json(
        { error: "Invalid payment received date" },
        { status: 400 },
      );
    }
    if (
      Object.hasOwn(data, "statusAt") &&
      (typeof data.statusAt !== "string" ||
        Number.isNaN(new Date(data.statusAt).getTime()))
    ) {
      return NextResponse.json(
        { error: "Invalid order status date" },
        { status: 400 },
      );
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      select: {
        status: true,
        placedAt: true,
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
    const statusChanged = status !== undefined && status !== existing.status;
    if (
      status &&
      !canTransitionOrderStatus(
        existing.status as OrderStatus,
        status as OrderStatus,
      )
    ) {
      return NextResponse.json(
        { error: `Order status cannot move from ${existing.status} back to ${status}` },
        { status: 409 },
      );
    }
    if (
      status &&
      status !== existing.status &&
      !statusDate
    ) {
      return NextResponse.json(
        { error: `Select a date and time for the ${orderStatusDateLabel(status)} status` },
        { status: 400 },
      );
    }
    if (statusDate && statusDate < existing.placedAt) {
      return NextResponse.json(
        { error: "The payment or status time cannot be before the order was placed" },
        { status: 400 },
      );
    }
    const now = new Date();
    const eventDate = statusDate ?? now;
    const updateData = {
      ...(status ? { status } : {}),
      ...(hasNote ? { internalNote: data.internalNote as string | null } : {}),
      ...(status === "PAID" && (statusChanged || statusDate)
        ? { paymentStatus: "PAID" as const, paidAt: eventDate }
        : {}),
      ...(status === "SHIPPED" && (statusChanged || statusDate)
        ? { shippedAt: eventDate }
        : {}),
      ...(status === "DELIVERED" && (statusChanged || statusDate)
        ? { deliveredAt: eventDate }
        : {}),
      ...(status === "CANCELLED" && (statusChanged || statusDate)
        ? { cancelledAt: eventDate }
        : {}),
    };

    const updateResult = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!current) return "missing";
      if (
        status &&
        !canTransitionOrderStatus(current.status as OrderStatus, status as OrderStatus)
      )
        return "invalid-transition";
      if (status && current.status !== status && !statusDate)
        return "missing-status-date";

      await tx.order.update({ where: { id }, data: updateData });
      if (status === "PAID" && statusChanged) {
        const receivedAt = eventDate;
        await tx.payment.updateMany({
          where: { orderId: id, status: "PENDING" },
          data: { status: "PAID", paidAt: receivedAt, recordedById: context.user.id },
        });
      }
      if (status && status !== existing.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status,
            changedById: context.user.id,
            note: `Status changed from ${existing.status} to ${status}`,
            createdAt: eventDate,
          },
        });
      }
      return "updated";
    });
    if (updateResult === "invalid-transition")
      return NextResponse.json(
        { error: "The order status changed while saving. Reload and try again." },
        { status: 409 },
      );
    if (updateResult === "missing-status-date")
      return NextResponse.json(
        { error: `Select a date and time for the ${orderStatusDateLabel(status!)} status` },
        { status: 400 },
      );
    if (updateResult === "missing")
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

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
