import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import {
  blankToNull,
  serializeVariant,
  variantSchema,
} from "@/lib/variant";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

const idOf = async (ctx: Ctx) => {
  const id = Number((await ctx.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const PUT = withPermission(PERM.VARIANTS_MANAGE)(
  async (req: NextRequest, context) => {
  const id = await idOf(context as Ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const data = blankToNull(variantSchema.partial().parse(await req.json()));
    const variant = await prisma.productVariant.update({ where: { id }, data });
    return NextResponse.json(serializeVariant(variant));
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: "Invalid input", details: e.issues },
        { status: 400 },
      );
    const code = (e as { code?: string })?.code;
    if (code === "P2025")
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    if (code === "P2002")
      return NextResponse.json(
        { error: "That SKU is already in use" },
        { status: 409 },
      );
    console.error("PUT /api/variants/[id]:", e);
    return NextResponse.json(
      { error: "Failed to update variant" },
      { status: 500 },
    );
  }
  },
);

export const DELETE = withPermission(PERM.VARIANTS_MANAGE)(
  async (_req: NextRequest, context) => {
  const id = await idOf(context as Ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await prisma.productVariant.delete({ where: { id } }); // order history keeps its own snapshot
    return NextResponse.json({ ok: true });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025")
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    console.error("DELETE /api/variants/[id]:", e);
    return NextResponse.json(
      { error: "Failed to delete variant" },
      { status: 500 },
    );
  }
  },
);
