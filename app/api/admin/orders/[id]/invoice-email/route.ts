import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { issueInvoiceSafely } from "@/lib/invoices/invoice";
import { sendInvoiceEmail } from "@/lib/email";
import { money } from "@/lib/format";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = withPermission(PERM.INVOICES_ISSUE)(
  async (_request, context) => {
    const id = Number((await (context as Context).params).id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        select: {
          orderNumber: true,
          currency: true,
          grandTotal: true,
          guestEmail: true,
          shipFullName: true,
          user: {
            select: { email: true, firstName: true },
          },
        },
      });
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const email = order.user?.email ?? order.guestEmail;
      if (!email) {
        return NextResponse.json(
          { error: "Add an email address to the customer before sending an invoice" },
          { status: 422 },
        );
      }
      if (!process.env.INVOICE_URL_SECRET || process.env.INVOICE_URL_SECRET.length < 32) {
        return NextResponse.json(
          { error: "Invoice email links are not configured. Set INVOICE_URL_SECRET to a secret of at least 32 characters." },
          { status: 503 },
        );
      }

      const invoice = await issueInvoiceSafely(id);
      if (!invoice) {
        return NextResponse.json(
          { error: "No invoice is available for this order status" },
          { status: 409 },
        );
      }

      const sent = await sendInvoiceEmail({
        to: email,
        firstName:
          order.user?.firstName ??
          order.shipFullName?.trim().split(/\s+/)[0] ??
          "Customer",
        orderNumber: order.orderNumber,
        invoiceNumber: invoice.number,
        total: money(Number(order.grandTotal), order.currency),
        currency: order.currency,
        invoiceUrl: invoice.signedUrl,
      });
      if (!sent) {
        return NextResponse.json(
          { error: "Invoice was generated, but email delivery failed. Check email configuration and try again." },
          { status: 502 },
        );
      }

      return NextResponse.json({
        ok: true,
        invoice: {
          id: invoice.id,
          number: invoice.number,
          kind: invoice.kind,
          url: invoice.url,
        },
      });
    } catch (error) {
      console.error("POST /api/admin/orders/[id]/invoice-email:", error);
      return NextResponse.json(
        { error: "Could not send invoice email" },
        { status: 500 },
      );
    }
  },
);
