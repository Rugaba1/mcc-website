import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { ROLE_IDS } from "@/lib/constants";

export const runtime = "nodejs";

export const GET = withPermission(PERM.ORDERS_MANAGE)(async () => {
  try {
    const [accounts, savedCustomers, currency] = await Promise.all([
      prisma.user.findMany({
        where: {
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
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      prisma.savedCustomer.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          tin: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      prisma.currency.findFirst({
        where: { enabled: true, isBase: true },
        select: { code: true, decimalDigits: true },
      }),
    ]);

    if (!currency) {
      return NextResponse.json(
        { error: "Store base currency is not configured" },
        { status: 503 },
      );
    }

    const variants = await prisma.productVariant.findMany({
      where: { active: true, currency: currency.code, product: { status: "ACTIVE" } },
      select: {
        id: true,
        sku: true,
        size: true,
        finish: true,
        shadeCode: true,
        image: true,
        pricePerSqm: true,
        containerPricePerSqm: true,
        sqmPerContainer: true,
        product: { select: { name: true } },
        inventory: {
          select: {
            onHandSqm: true,
            reservedSqm: true,
            allowBackorder: true,
          },
        },
      },
      orderBy: [{ product: { name: "asc" } }, { size: "asc" }],
    });

    return NextResponse.json({
      currency,
      customers: [
        ...accounts.map((customer) => ({
          key: `account:${customer.id}`,
          kind: "ACCOUNT" as const,
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          tin: null,
        })),
        ...savedCustomers.map((customer) => ({
          key: `saved:${customer.id}`,
          kind: "SAVED" as const,
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
          tin: customer.tin,
        })),
      ].sort((a, b) =>
        `${a.firstName} ${a.lastName ?? ""}`.localeCompare(
          `${b.firstName} ${b.lastName ?? ""}`,
        ),
      ),
      variants: variants.map((variant) => ({
        id: variant.id,
        productName: variant.product.name,
        sku: variant.sku,
        size: variant.size,
        finish: variant.finish,
        shadeCode: variant.shadeCode,
        image: variant.image,
        pricePerSqm: Number(variant.pricePerSqm),
        containerPricePerSqm:
          variant.containerPricePerSqm == null
            ? null
            : Number(variant.containerPricePerSqm),
        sqmPerContainer:
          variant.sqmPerContainer == null
            ? null
            : Number(variant.sqmPerContainer),
        inventory: variant.inventory
          ? {
              onHandSqm: Number(variant.inventory.onHandSqm),
              reservedSqm: Number(variant.inventory.reservedSqm),
              allowBackorder: variant.inventory.allowBackorder,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/orders/options:", error);
    return NextResponse.json(
      { error: "Failed to load order creation options" },
      { status: 500 },
    );
  }
});
