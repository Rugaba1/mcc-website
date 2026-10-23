import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-user";
import { sendContactAcknowledgement, sendContactStaffAlert } from "@/lib/email";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const schema = z.object({
  kind: z.enum(["CANCEL", "REFUND"]),
  reason: z.string().trim().min(10, "Please explain your request").max(3000),
});
const marker = (kind: "CANCEL" | "REFUND", orderId: number) =>
  `[ORDER_REQUEST:${kind}:${orderId}]`;

export async function GET(request: NextRequest, context: Context) {
  const { claims, error } = await requireUser(request);
  if (error) return error;
  const orderId = Number((await context.params).id);
  if (!Number.isSafeInteger(orderId) || orderId < 1)
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: claims.userId },
      select: { id: true, user: { select: { email: true } } },
    });
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const requests = await prisma.contactMessage.findMany({
      where: {
        email: order.user?.email ?? "",
        OR: [
          { message: { startsWith: marker("CANCEL", orderId) } },
          { message: { startsWith: marker("REFUND", orderId) } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectType: true,
        status: true,
        createdAt: true,
        message: true,
      },
    });
    return NextResponse.json(
      requests.map((item) => {
        const orderNumber =
          /^\[ORDER_REQUEST:(?:CANCEL|REFUND):\d+\]\r?\nOrder: ([^\r\n]+)/.exec(
            item.message,
          )?.[1] ?? null;
        const reason =
          /Customer request:\r?\n([\s\S]*)$/.exec(item.message)?.[1] ??
          item.message;
        return {
          id: item.id,
          kind: item.projectType === "Order cancellation" ? "CANCEL" : "REFUND",
          status: item.status,
          createdAt: item.createdAt,
          orderNumber,
          message: reason,
        };
      }),
    );
  } catch (cause) {
    console.error("GET /api/me/orders/[id]/requests:", cause);
    return NextResponse.json(
      { error: "Could not load order requests" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: Context) {
  const { claims, error } = await requireUser(request);
  if (error) return error;
  const orderId = Number((await context.params).id);
  if (!Number.isSafeInteger(orderId) || orderId < 1)
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: claims.userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        shipPhone: true,
      },
    });
    if (!order?.user)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (
      parsed.data.kind === "CANCEL" &&
      !["PENDING", "PAID", "PROCESSING"].includes(order.status)
    )
      return NextResponse.json(
        { error: "This order can no longer be cancelled online" },
        { status: 409 },
      );
    if (
      parsed.data.kind === "REFUND" &&
      !["PAID", "PARTIALLY_REFUNDED"].includes(order.paymentStatus)
    )
      return NextResponse.json(
        { error: "This order has no eligible payment to refund" },
        { status: 409 },
      );

    const requestMarker = marker(parsed.data.kind, order.id);
    const projectType =
      parsed.data.kind === "CANCEL" ? "Order cancellation" : "Refund request";
    const existing = await prisma.contactMessage.findFirst({
      where: {
        email: order.user.email,
        projectType,
        status: { in: ["NEW", "READ"] },
        message: { startsWith: requestMarker },
      },
      select: { id: true },
    });
    if (existing)
      return NextResponse.json(
        { error: "You already have an open request for this order" },
        { status: 409 },
      );

    const message = `${requestMarker}\nOrder: ${order.orderNumber}\n\nCustomer request:\n${parsed.data.reason}`;
    const saved = await prisma.contactMessage.create({
      data: {
        firstName: order.user.firstName,
        lastName: order.user.lastName || "Customer",
        email: order.user.email,
        phone: order.user.phoneNumber ?? order.shipPhone,
        projectType,
        message,
      },
      select: { id: true, status: true, createdAt: true },
    });

    const [ackSent] = await Promise.all([
      sendContactAcknowledgement({
        to: order.user.email,
        firstName: order.user.firstName,
        message: `Your ${projectType.toLowerCase()} for order ${order.orderNumber} has been sent to our team.\n\n${parsed.data.reason}`,
      }),
      sendContactStaffAlert({
        name: `${order.user.firstName} ${order.user.lastName ?? ""}`.trim(),
        email: order.user.email,
        phone: order.user.phoneNumber ?? order.shipPhone,
        projectType,
        message,
      }),
    ]);
    if (ackSent)
      await prisma.contactMessage.update({
        where: { id: saved.id },
        data: { ackSentAt: new Date() },
      });

    return NextResponse.json(
      {
        id: saved.id,
        kind: parsed.data.kind,
        status: saved.status,
        createdAt: saved.createdAt,
        orderNumber: order.orderNumber,
        message: parsed.data.reason,
      },
      { status: 201 },
    );
  } catch (cause) {
    console.error("POST /api/me/orders/[id]/requests:", cause);
    return NextResponse.json(
      { error: "Could not submit your order request" },
      { status: 500 },
    );
  }
}
