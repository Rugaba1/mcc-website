import { randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { hasPermissions } from "@/lib/permissions/core";
import { ROLE_IDS } from "@/lib/constants";
import { computeTotals } from "@/lib/pricing";
import { calculateDeliveryFee } from "@/lib/shipping";
import { priceLine } from "@/lib/sale-pricing";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { isValidLocation } from "@/lib/locations";
import { isValidRwandaTin } from "@/lib/rwanda-tin";
import { METHODS, syncOrderPayment } from "@/lib/payments/sync";
import { issueInvoiceSafely } from "@/lib/invoices/invoice";

export const runtime = "nodejs";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || null);

const schema = z
  .object({
    customerKind: z.enum(["ACCOUNT", "SAVED", "NEW"]),
    customerId: z.number().int().positive().optional(),
    customerName: z.string().trim().min(2).max(240),
    email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
    phone: z
      .string()
      .trim()
      .max(20)
      .refine((value) => isValidPhoneNumber(value), "Enter a valid phone number"),
    tin: z
      .union([z.string().trim(), z.literal("")])
      .optional()
      .refine(
        (value) => !value || isValidRwandaTin(value),
        "Enter a valid 9-digit Rwanda TIN",
      ),
    fulfillment: z.enum(["DELIVERY", "PICKUP"]),
    province: optionalText(100),
    district: optionalText(100),
    sector: optionalText(100),
    street: optionalText(255),
    shipNotes: optionalText(2000),
    customerNote: optionalText(2000),
    internalNote: optionalText(5000),
    items: z
      .array(
        z
          .object({
            variantId: z.number().int().positive(),
          productName: z.string().trim().min(1).max(255).optional(),
          saleType: z.enum(["SQM", "CONTAINER"]),
          quantity: z.number().positive().max(100_000),
          })
          .refine(
            (item) =>
              item.saleType !== "CONTAINER" ||
              Number.isInteger(item.quantity),
            {
              path: ["quantity"],
              message: "Container quantities must be whole numbers",
            },
          ),
      )
      .min(1)
      .max(50),
    initialPayment: z
      .object({
        amount: z.number().positive().max(1_000_000_000),
        method: z.enum(METHODS),
        providerRef: optionalText(150),
        payerPhone: optionalText(20),
        note: optionalText(255),
        paidAt: z.string().datetime(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.customerKind !== "NEW" && !data.customerId) {
      ctx.addIssue({
        code: "custom",
        path: ["customerId"],
        message: "Select an existing customer",
      });
    }
    const [first, ...rest] = data.customerName.trim().split(/\s+/);
    if (first.length > 120 || rest.join(" ").length > 120) {
      ctx.addIssue({
        code: "custom",
        path: ["customerName"],
        message: "Customer name must be 120 characters or fewer per name field",
      });
    }
    if (data.fulfillment === "DELIVERY") {
      if (!data.province || !data.district || !data.street) {
        ctx.addIssue({
          code: "custom",
          path: ["street"],
          message: "Province, district and street are required for delivery",
        });
      } else if (
        !isValidLocation(data.province, data.district, data.sector || undefined)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["district"],
          message: "Invalid province, district or sector",
        });
      }
    }
  });

class OrderCreationError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export const POST = withPermission(PERM.ORDERS_MANAGE)(
  async (request: NextRequest, context) => {
    try {
      const data = schema.parse(await request.json());
      if (
        data.initialPayment &&
        !hasPermissions(
          context.user.permissions,
          [PERM.PAYMENTS_RECORD],
        )
      ) {
        return NextResponse.json(
          { error: "You do not have permission to record payments" },
          { status: 403 },
        );
      }

      const names = data.customerName.trim().split(/\s+/);
      const firstName = names[0] ?? data.customerName;
      const lastName = names.slice(1).join(" ") || null;
      const email = data.email?.trim() || null;
      const tin = data.tin?.trim() || null;
      const wanted = new Map<
        string,
        {
          variantId: number;
          productName: string;
          saleType: "SQM" | "CONTAINER";
          quantity: number;
        }
      >();
      for (const item of data.items) {
        const productName = item.productName ?? "";
        const key = `${item.variantId}:${item.saleType}:${productName}`;
        const current = wanted.get(key);
        wanted.set(key, {
          variantId: item.variantId,
          productName,
          saleType: item.saleType,
          quantity:
            Math.round(((current?.quantity ?? 0) + item.quantity) * 100) / 100,
        });
      }
      const variantIds = [...new Set([...wanted.values()].map((item) => item.variantId))];
      const orderNumber = `MCC-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${randomInt(100000, 1000000)}`;

      const created = await prisma.$transaction(async (tx) => {
        const currency = await tx.currency.findFirst({
          where: { enabled: true, isBase: true },
          select: { code: true },
        });
        if (!currency) {
          throw new OrderCreationError(
            "Store base currency is not configured",
            503,
          );
        }

        let userId: number | null = null;
        let savedCustomerId: number | null = null;
        let storedEmail = email;
        let storedPhone = data.phone;
        let name = data.customerName.trim();
        let savedTin = tin;

        if (data.customerKind === "ACCOUNT") {
          const account = await tx.user.findFirst({
            where: {
              id: data.customerId,
              isActive: true,
              role: { some: { id: ROLE_IDS.CUSTOMER } },
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          });
          if (!account)
            throw new OrderCreationError("The selected account customer was not found", 404);
          userId = account.id;
          name = [account.firstName, account.lastName].filter(Boolean).join(" ");
          storedEmail = account.email;
          storedPhone = data.phone || account.phoneNumber || "";
        } else if (data.customerKind === "SAVED") {
          const customer = await tx.savedCustomer.findUnique({
            where: { id: data.customerId },
          });
          if (!customer)
            throw new OrderCreationError("The selected saved customer was not found", 404);
          savedCustomerId = customer.id;
          name = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
          storedEmail = customer.email ?? email;
          storedPhone = data.phone || customer.phoneNumber;
          savedTin = tin || customer.tin;
        } else {
          const customer = await tx.savedCustomer.create({
            data: {
              firstName,
              lastName,
              email,
              phoneNumber: data.phone,
              tin,
            },
          });
          savedCustomerId = customer.id;
        }

        if (!storedPhone) {
          throw new OrderCreationError("A customer phone number is required");
        }

        const variants = await tx.productVariant.findMany({
          where: {
            id: { in: variantIds },
            active: true,
            currency: currency.code,
            product: { status: "ACTIVE" },
          },
          include: {
            product: { select: { name: true } },
            inventory: { select: { allowBackorder: true } },
          },
        });
        if (variants.length !== variantIds.length) {
          throw new OrderCreationError(
            "Some selected products are no longer available at the store currency",
            409,
          );
        }

        const byId = new Map(variants.map((variant) => [variant.id, variant]));
        const lines = [...wanted.values()].map((item) => {
          const variant = byId.get(item.variantId);
          if (!variant) throw new OrderCreationError("Selected product not found", 404);
          try {
            const line = priceLine(
              {
                pricePerSqm: Number(variant.pricePerSqm),
                containerPricePerSqm:
                  variant.containerPricePerSqm == null
                    ? null
                    : Number(variant.containerPricePerSqm),
                sqmPerContainer:
                  variant.sqmPerContainer == null
                    ? null
                    : Number(variant.sqmPerContainer),
              },
              item.saleType,
              item.quantity,
            );
            return { variant, line, productName: item.productName };
          } catch (error) {
            throw new OrderCreationError(
              `${variant.product.name} (${variant.size}): ${
                error instanceof Error ? error.message : "Invalid quantity"
              }`,
            );
          }
        });

        const sqmByVariant = new Map<number, number>();
        for (const { variant, line } of lines) {
          sqmByVariant.set(
            variant.id,
            Math.round(((sqmByVariant.get(variant.id) ?? 0) + line.sqm) * 100) /
              100,
          );
        }
        for (const [variantId, sqm] of sqmByVariant) {
          const updated = await tx.$executeRaw`
            UPDATE inventory
            SET reservedBoxes = reservedBoxes + ${sqm}
            WHERE variantId = ${variantId}
              AND (allowBackorder = 1 OR onHandBoxes - reservedBoxes >= ${sqm})`;
          if (updated === 0) {
            const variant = byId.get(variantId)!;
            throw new OrderCreationError(
              `Not enough stock for ${variant.product.name} (${variant.size})`,
              409,
            );
          }
        }

        const totalSqm = lines.reduce((sum, { line }) => sum + line.sqm, 0);
        const shippingFee =
          data.fulfillment === "DELIVERY" ? calculateDeliveryFee(totalSqm) : 0;
        const totals = computeTotals(
          lines.map(({ line }) => ({ price: line.total, qty: 1 })),
          shippingFee,
        );
        if (
          !Number.isFinite(totals.total) ||
          totals.total <= 0 ||
          totals.total > 9_999_999_999.99
        ) {
          throw new OrderCreationError("Order total is outside the supported range");
        }
        if (data.initialPayment && data.initialPayment.amount > totals.total + 0.005) {
          throw new OrderCreationError("Initial payment cannot exceed the order total");
        }
        const placedAt = new Date();
        if (
          data.initialPayment &&
          new Date(data.initialPayment.paidAt) > new Date(Date.now() + 60_000)
        ) {
          throw new OrderCreationError("Payment received time cannot be in the future");
        }

        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            savedCustomerId,
            guestEmail: userId ? null : storedEmail,
            guestPhone: userId ? null : storedPhone,
            tin: savedTin,
            status: "PENDING",
            paymentStatus: "PENDING",
            fulfillment: data.fulfillment,
            subtotal: totals.subtotal,
            shippingFee: totals.shippingFee,
            taxTotal: totals.tax,
            grandTotal: totals.total,
            currency: currency.code,
            shipFullName: name,
            shipPhone: storedPhone,
            shipProvince: data.fulfillment === "DELIVERY" ? data.province : null,
            shipDistrict: data.fulfillment === "DELIVERY" ? data.district : null,
            shipSector: data.fulfillment === "DELIVERY" ? data.sector : null,
            shipStreet: data.fulfillment === "DELIVERY" ? data.street : null,
            shipNotes: data.shipNotes,
            customerNote: data.customerNote,
            internalNote: data.internalNote,
            placedAt,
            items: {
              create: lines.map(({ variant, line, productName }) => ({
                variantId: variant.id,
                productName: productName || variant.product.name,
                sku: variant.sku,
                size: variant.size,
                finish: variant.finish,
                shadeCode: variant.shadeCode,
                image: variant.image,
                saleType: line.saleType,
                quantity: line.sqm,
                containers: line.containers || null,
                unitPrice: line.pricePerSqm,
                lineTotal: line.total,
              })),
            },
            history: {
              create: {
                status: "PENDING",
                note: "Order created by staff",
                changedById: context.user.id,
              },
            },
          },
          select: { id: true, orderNumber: true, currency: true },
        });

        await tx.stockMovement.createMany({
          data: [...sqmByVariant].map(([variantId, quantity]) => ({
            variantId,
            type: "RESERVE" as const,
            quantity,
            reference: order.orderNumber,
            note: "Staff-created order",
            createdById: context.user.id,
          })),
        });

        if (data.initialPayment) {
          await tx.payment.create({
            data: {
              orderId: order.id,
              method: data.initialPayment.method,
              status: "PAID",
              amount: data.initialPayment.amount,
              currency: currency.code,
              provider: "manual",
              providerRef: data.initialPayment.providerRef,
              payerPhone: data.initialPayment.payerPhone,
              note: data.initialPayment.note,
              paidAt: new Date(data.initialPayment.paidAt),
              recordedById: context.user.id,
            },
          });
          await syncOrderPayment(tx, order.id, context.user.id);
        }

        await tx.adminNotification.create({
          data: {
            type: "order",
            requiredPermission: PERM.ORDERS_VIEW,
            title: "Walk-in order created",
            message: `${order.orderNumber} · ${currency.code} ${totals.total}`,
            targetPath: "/admin/orders",
            entityId: order.id,
          },
        });
        return order;
      });

      const invoice = await issueInvoiceSafely(created.id);
      return NextResponse.json(
        {
          id: created.id,
          orderNumber: created.orderNumber,
          invoice,
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.issues[0]?.message ?? "Invalid input" },
          { status: 400 },
        );
      }
      if (error instanceof OrderCreationError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      if ((error as { code?: string })?.code === "P2002") {
        return NextResponse.json(
          { error: "The order number or payment reference is already in use" },
          { status: 409 },
        );
      }
      console.error("POST /api/admin/orders:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }
  },
);
