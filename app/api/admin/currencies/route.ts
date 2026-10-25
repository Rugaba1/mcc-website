import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { getBaseCurrency, serializeCurrency } from "@/lib/currency";

export const runtime = "nodejs";

const currencyCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code")
  .refine((code) => {
    try {
      new Intl.NumberFormat("en", { style: "currency", currency: code }).format(1);
      return true;
    } catch {
      return false;
    }
  }, "Currency must be a supported ISO 4217 code");

const createSchema = z.object({
  code: currencyCode,
  name: z.string().trim().min(1).max(80),
  symbol: z.string().trim().min(1).max(8),
  decimalDigits: z.number().int().min(0).max(4),
  rateToBase: z.number().positive().max(1_000_000_000),
}).strict();

const updateSchema = z.object({
  code: currencyCode,
  name: z.string().trim().min(1).max(80).optional(),
  symbol: z.string().trim().min(1).max(8).optional(),
  decimalDigits: z.number().int().min(0).max(4).optional(),
  rateToBase: z.number().positive().max(1_000_000_000).optional(),
  enabled: z.boolean().optional(),
}).strict();

export const GET = withPermission(PERM.SETTINGS_MANAGE)(async () => {
  try {
    const rows = await prisma.currency.findMany({
      orderBy: [{ isBase: "desc" }, { code: "asc" }],
    });
    getBaseCurrency(rows.map(serializeCurrency));
    return NextResponse.json({ currencies: rows.map(serializeCurrency) });
  } catch (error) {
    console.error("GET /api/admin/currencies configuration error:", error);
    return NextResponse.json(
      { error: "Configure exactly one base currency before managing currencies" },
      { status: 409 },
    );
  }
});

export const POST = withPermission(PERM.SETTINGS_MANAGE)(
  async (request: NextRequest) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid currency" },
        { status: 400 },
      );
    }

    try {
      const configuredCurrencies = await prisma.currency.findMany();
      getBaseCurrency(configuredCurrencies.map(serializeCurrency));
      const created = await prisma.currency.create({
        data: { ...parsed.data, isBase: false },
      });
      return NextResponse.json(
        { currency: serializeCurrency(created) },
        { status: 201 },
      );
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "That currency code already exists" },
          { status: 409 },
        );
      }
      console.error("POST /api/admin/currencies failed:", error);
      return NextResponse.json({ error: "Could not create currency" }, { status: 500 });
    }
  },
);

export const PATCH = withPermission(PERM.SETTINGS_MANAGE)(
  async (request: NextRequest) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid currency" },
        { status: 400 },
      );
    }
    const { code, ...data } = parsed.data;

    try {
      const currency = await prisma.currency.findUnique({ where: { code } });
      if (!currency) {
        return NextResponse.json({ error: "Currency not found" }, { status: 404 });
      }
      if (currency.isBase && data.enabled === false) {
        return NextResponse.json(
          { error: "The base currency cannot be disabled" },
          { status: 409 },
        );
      }
      if (currency.isBase && data.rateToBase !== undefined && data.rateToBase !== 1) {
        return NextResponse.json(
          { error: "The base currency rate must remain 1" },
          { status: 400 },
        );
      }
      const updated = await prisma.currency.update({ where: { code }, data });
      return NextResponse.json({ currency: serializeCurrency(updated) });
    } catch (error) {
      console.error("PATCH /api/admin/currencies failed:", error);
      return NextResponse.json({ error: "Could not update currency" }, { status: 500 });
    }
  },
);
