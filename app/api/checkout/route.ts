import { createHash, randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withOptionalAuth } from "@/lib/middleware/withAuth";
import { computeTotals } from "@/lib/pricing";
import { getShipping, SHIPPING_IDS } from "@/lib/shipping";
import { PaymentMethod, PaymentStatus } from "@/lib/generated/prisma";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { isValidLocation } from "@/lib/locations";
import { PAYMENT_METHODS } from "@/lib/payments";
import { issueInvoiceSafely } from "@/lib/invoices/invoice";
import { priceLine, SaleType } from "@/lib/sale-pricing";
import {
  sendAdminNotificationEmail,
  sendOrderPlacedEmail,
} from "@/lib/email";
import { formatNumber, money } from "@/lib/format";
import { siteConfig } from "@/config/site.config";
import { COMPANY } from "@/lib/company";
import { PERM } from "@/lib/permissions/catalog";
import {
  calculateCouponDiscount,
  normalizeCouponCode,
} from "@/lib/coupons";
import { releaseExpiredCheckoutReservations } from "@/lib/checkout/reservations";
import { isValidRwandaTin } from "@/lib/rwanda-tin";

export const runtime = "nodejs";

class CheckoutError extends Error {}

const r2 = (n: number) => Math.round(n * 100) / 100;

const schema = z
  .object({
    items: z
      .array(
        z
          .object({
            variantId: z.number().int().positive(),
            saleType: z.enum(["SQM", "CONTAINER"]).default("SQM"),
            qty: z.number().positive().max(100_000), // m² for SQM, containers for CONTAINER
          })
          .refine((i) => i.saleType === "SQM" || Number.isInteger(i.qty), {
            message: "Containers must be a whole number",
            path: ["qty"],
          }),
      )
      .min(1)
      .max(50),
    reservationToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/).optional(),
    shippingId: z.enum(SHIPPING_IDS),
    fullName: z.string().trim().min(2).max(120),
    tin: z.string().trim().optional().refine(
      (value) => value === undefined || value === "" || isValidRwandaTin(value),
      "Enter a valid 9-digit Rwanda TIN",
    ),
    email: z.string().trim().email().max(254).optional(),
    phone: z
      .string()
      .trim()
      .refine((v) => isValidPhoneNumber(v), "Enter a valid phone number"),
    province: z.string().trim().max(80).optional(),
    district: z.string().trim().max(80).optional(),
    sector: z.string().trim().max(80).optional(),
    street: z.string().trim().max(200).optional(),
    note: z.string().trim().max(1000).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS),
    couponCode: z.string().trim().max(50).transform(normalizeCouponCode).optional(),
  })
  .superRefine((d, ctx) => {
    if (getShipping(d.shippingId).fulfillment !== "DELIVERY") return;
    if (!d.province || !d.district || !d.street) {
      ctx.addIssue({
        code: "custom",
        path: ["street"],
        message: "Province, district and street are required for delivery",
      });
    } else if (
      !isValidLocation(d.province, d.district, d.sector || undefined)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["district"],
        message: "Invalid province, district or sector",
      });
    }
  });

export const POST = withOptionalAuth(
async (request: NextRequest, { user, locale }) => {
  try {
    const d = schema.parse(await request.json());
    if (!user && !d.email) {
      return NextResponse.json(
        { error: "Email is required for guest checkout" },
        { status: 400 },
      );
    }
    const ship = getShipping(d.shippingId);

    // Merge duplicate lines: same variant AND same sale type
    const wanted = new Map<
      string,
      { variantId: number; saleType: SaleType; qty: number }
    >();
    for (const i of d.items) {
      const key = `${i.variantId}:${i.saleType}`;
      const cur = wanted.get(key);
      wanted.set(key, {
        variantId: i.variantId,
        saleType: i.saleType,
        qty: r2((cur?.qty ?? 0) + i.qty),
      });
    }
    const ids = [...new Set([...wanted.values()].map((w) => w.variantId))];

    await prisma.$transaction((tx) => releaseExpiredCheckoutReservations(tx));

    const order = await prisma.$transaction(async (tx) => {
      const baseCurrency = await tx.currency.findFirst({
        where: { isBase: true, enabled: true },
        select: { code: true, decimalDigits: true },
      });
      if (!baseCurrency) {
        throw new CheckoutError("Store base currency is not configured");
      }
      const customer = user ? await tx.user.findUnique({
        where: { id: user.id },
        select: { isActive: true, email: true, firstName: true, lastName: true },
      }) : null;
      if (user && !customer?.isActive)
        throw new CheckoutError("Account is not active");

      const variants = await tx.productVariant.findMany({
        where: { id: { in: ids }, active: true, product: { status: "ACTIVE" } },
        include: { product: { select: { name: true } } },
      });
      if (variants.length !== ids.length) {
        throw new CheckoutError(
          "Some items in your cart are no longer available",
        );
      }
      if (variants.some((variant) => variant.currency !== baseCurrency.code)) {
        throw new CheckoutError(
          "Some items are not priced in the store base currency. Please contact support.",
        );
      }
      const byId = new Map(variants.map((v) => [v.id, v]));

      // Prices come from the database, never from the browser
      const lines = [...wanted.values()].map((w) => {
        const v = byId.get(w.variantId)!;
        const label = `${v.product.name} (${v.size})`;
        const pricePerSqm = Number(v.pricePerSqm);
        if (!(pricePerSqm > 0))
          throw new CheckoutError(`${label} has no price yet`);
        try {
          const line = priceLine(
            {
              pricePerSqm,
              containerPricePerSqm:
                v.containerPricePerSqm != null
                  ? Number(v.containerPricePerSqm)
                  : null,
              sqmPerContainer:
                v.sqmPerContainer != null ? Number(v.sqmPerContainer) : null,
            },
            w.saleType,
            w.qty,
          );
          return { v, line };
        } catch (e) {
          throw new CheckoutError(`${label}: ${(e as Error).message}`);
        }
      });

      const sqmByVariant = new Map<number, number>();
      for (const { v, line } of lines) {
        sqmByVariant.set(v.id, r2((sqmByVariant.get(v.id) ?? 0) + line.sqm));
      }

      let reservationId: number | null = null;
      if (d.reservationToken) {
        const reservation = await tx.checkoutReservation.findUnique({
          where: {
            tokenHash: createHash("sha256").update(d.reservationToken).digest("hex"),
          },
          include: { items: true },
        });
        if (
          !reservation ||
          reservation.status !== "ACTIVE" ||
          reservation.expiresAt <= new Date()
        ) {
          throw new CheckoutError("Your stock hold expired. Please try placing the order again.");
        }
        const reserved = new Map(
          reservation.items.map((item) => [item.variantId, Number(item.quantitySqm)]),
        );
        if (
          reserved.size !== sqmByVariant.size ||
          [...sqmByVariant].some(
            ([variantId, sqm]) =>
              Math.abs((reserved.get(variantId) ?? -1) - sqm) > 0.005,
          )
        ) {
          throw new CheckoutError("Your cart changed. Please refresh the stock reservation.");
        }
        reservationId = reservation.id;
      } else {
        for (const [variantId, sqm] of sqmByVariant) {
          const n = await tx.$executeRaw`
            UPDATE inventory
            SET reservedBoxes = reservedBoxes + ${sqm}
            WHERE variantId = ${variantId}
              AND (allowBackorder = 1 OR onHandBoxes - reservedBoxes >= ${sqm})`;
          if (n === 0) {
            const v = byId.get(variantId)!;
            throw new CheckoutError(
              `Not enough stock for ${v.product.name} (${v.size})`,
            );
          }
        }
      }

      // Each line total is already rounded, so feed them in as price × 1
      const totals = computeTotals(
        lines.map((l) => ({ price: l.line.total, qty: 1 })),
        ship.fee,
      );
      const coupon = d.couponCode
        ? await tx.coupon.findUnique({ where: { code: d.couponCode } })
        : null;
      if (d.couponCode && !coupon) {
        throw new CheckoutError("Coupon code is invalid");
      }

      let discountTotal = 0;
      if (coupon) {
        const validation = calculateCouponDiscount(coupon, totals.subtotal);
        if (validation.error) throw new CheckoutError(validation.error);
        const now = new Date();
        const use = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            active: true,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
              ...(coupon.maxUses === null
                ? []
                : [{ usedCount: { lt: coupon.maxUses } }]),
            ],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (use.count !== 1) {
          throw new CheckoutError("This coupon is no longer available");
        }
        discountTotal = validation.discount;
      }
      const discountedTotals = computeTotals(
        [{ price: totals.subtotal - discountTotal, qty: 1 }],
        ship.fee,
      );
      const delivery = ship.fulfillment === "DELIVERY";
      const orderNumber = `MCC-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${randomInt(100000, 1000000)}`;

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user?.id ?? null,
          guestEmail: user ? null : d.email,
          fulfillment: ship.fulfillment,
          subtotal: totals.subtotal,
          discountTotal,
          shippingFee: totals.shippingFee,
          taxTotal: discountedTotals.tax,
          grandTotal: discountedTotals.total,
          currency: baseCurrency.code,
          couponId: coupon?.id ?? null,
          shipFullName: d.fullName,
          shipPhone: d.phone,
          tin: d.tin || null,
          shipProvince: delivery ? (d.province ?? null) : null,
          shipDistrict: delivery ? (d.district ?? null) : null,
          shipSector: delivery ? d.sector || null : null,
          shipStreet: delivery ? (d.street ?? null) : null,
          customerNote: d.note || null,
          items: {
            create: lines.map(({ v, line }) => ({
              variantId: v.id,
              productName: v.product.name,
              sku: v.sku,
              size: v.size,
              finish: v.finish,
              shadeCode: v.shadeCode,
              image: v.image,
              saleType: line.saleType,
              quantity: line.sqm, // always m²
              containers: line.containers || null,
              unitPrice: line.pricePerSqm, // per m²
              lineTotal: line.total,
            })),
          },
          history: {
            create: {
              status: "PENDING",
              note: "Order placed",
              changedById: user?.id ?? null,
            },
          },
          payments: {
            create: {
              amount: discountedTotals.total,
              payerPhone: d.phone,
              status: PaymentStatus.PENDING,
              currency: baseCurrency.code,
              method: d.paymentMethod as PaymentMethod,
              // "manual" = the customer can add the transaction ID or withdraw it from My payments
              provider: d.paymentMethod === "CARD" ? null : "manual",
            },
          },
        },
        select: { id: true, orderNumber: true, currency: true },
      });

      if (reservationId) {
        const consumed = await tx.checkoutReservation.updateMany({
          where: {
            id: reservationId,
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
          },
          data: { status: "CONSUMED" },
        });
        if (consumed.count !== 1) {
          throw new CheckoutError("Your stock hold expired. Please try placing the order again.");
        }
      } else {
        await tx.stockMovement.createMany({
          data: [...sqmByVariant].map(([variantId, sqm]) => ({
            variantId,
            type: "RESERVE" as const,
            quantity: sqm,
            reference: created.orderNumber,
            createdById: user?.id ?? null,
          })),
        });
      }
      await tx.adminNotification.create({
        data: {
          type: "order",
          requiredPermission: PERM.ORDERS_VIEW,
          title: "New order placed",
          message: `${created.orderNumber} · ${baseCurrency.code} ${discountedTotals.total}`,
          targetPath: "/admin/orders",
          entityId: created.id,
        },
      });

      return {
        ...created,
        customerEmail: customer?.email ?? d.email!,
        customerName:
          [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") ||
          d.fullName,
        customerFirstName: customer?.firstName ?? d.fullName.split(" ")[0],
        discount: discountTotal,
        couponCode: coupon?.code ?? null,
        total: discountedTotals.total,
        currency: baseCurrency.code,
        currencyDigits: baseCurrency.decimalDigits,
        subtotal: totals.subtotal,
        shipping: totals.shippingFee,
        tax: discountedTotals.tax,
        fulfillment: ship.fulfillment,
        paymentMethod: d.paymentMethod,
        deliveryAddress: delivery
          ? [d.street, d.sector, d.district, d.province].filter(Boolean).join(", ")
          : undefined,
        items: lines.map(({ v, line }) => ({
          name: v.product.name,
          size: v.size,
          quantity:
            line.saleType === "CONTAINER"
              ? `${line.containers} container${line.containers === 1 ? "" : "s"} · ${formatNumber(line.sqm, locale, { maximumFractionDigits: 2 })} m²`
              : `${formatNumber(line.sqm, locale, { maximumFractionDigits: 2 })} m²`,
          unitPrice: line.pricePerSqm,
          lineTotal: line.total,
        })),
      };
    });

    // After the commit, so the invoice code can see the order. Never throws.
    const invoice = await issueInvoiceSafely(order.id);
    const total = money(order.total, order.currency, locale, order.currencyDigits);
    const subtotal = money(order.subtotal, order.currency, locale, order.currencyDigits);
    const shipping = money(order.shipping, order.currency, locale, order.currencyDigits);
    const tax = money(order.tax, order.currency, locale, order.currencyDigits);
    const discount = money(order.discount, order.currency, locale, order.currencyDigits);
    await Promise.all([
      sendOrderPlacedEmail({
        to: order.customerEmail,
        firstName: order.customerFirstName,
        orderNumber: order.orderNumber,
        currency: order.currency,
        subtotal,
        discount: order.discount > 0 ? discount : undefined,
        couponCode: order.couponCode ?? undefined,
        shipping,
        tax,
        total,
        fulfillment: order.fulfillment === "DELIVERY" ? "Delivery" : "Customer pickup",
        paymentMethod: order.paymentMethod.replace(/_/g, " "),
        paymentInstructions:
          order.paymentMethod === "BANK_TRANSFER"
            ? COMPANY.paymentInstructions
            : undefined,
        deliveryAddress: order.deliveryAddress,
        orderUrl: new URL(`/${locale}/account/orders`, siteConfig.siteUrl).toString(),
        invoiceUrl: invoice?.signedUrl,
        items: order.items.map((item) => ({
          name: item.name,
          size: item.size,
          quantity: item.quantity,
          unitPrice: money(item.unitPrice, order.currency, locale, order.currencyDigits),
          lineTotal: money(item.lineTotal, order.currency, locale, order.currencyDigits),
        })),
      }),
      sendAdminNotificationEmail({
        name: order.customerName || "Customer",
        email: order.customerEmail,
        subject: `New order ${order.orderNumber}`,
        message: [
          `Order ${order.orderNumber} has been placed.`,
          `Fulfilment: ${order.fulfillment}`,
          `Payment method: ${order.paymentMethod.replace(/_/g, " ")}`,
          `Subtotal: ${subtotal}`,
          ...(order.discount > 0
            ? [`Coupon ${order.couponCode}: -${discount}`]
            : []),
          `Delivery: ${shipping}`,
          `Tax: ${tax}`,
          `Total: ${total}`,
          `Items: ${order.items.map((item) => `${item.name} (${item.size}) × ${item.quantity}: ${money(item.lineTotal, order.currency, locale, order.currencyDigits)}`).join("; ")}`,
        ].join("\n"),
      }),
    ]);

    return NextResponse.json(
      { id: order.id, orderNumber: order.orderNumber },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    if (e instanceof CheckoutError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    console.error("Checkout error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}, { interval: 60_000, uniqueTokenPerInterval: 10 });
