import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth/require-user";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { claims, error } = await requireUser(request);
  if (error) return error;

  const rows = await prisma.wishlistItem.findMany({
    where: { userId: claims.userId, product: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          image: true,
          categoryLabel: true,
          variants: {
            where: { active: true },
            orderBy: { pricePerBox: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  return NextResponse.json(
    rows.map(({ product: p }) => {
      const v = p.variants[0];
      return {
        productId: p.id,
        name: p.name,
        image: p.image,
        categoryLabel: p.categoryLabel,
        variant: v
          ? {
              id: v.id,
              size: v.size,
              color: v.color,
              finish: v.finish,
              sqmPerBox: Number(v.sqmPerBox),
              pricePerBox: Number(v.pricePerBox),
            }
          : null,
      };
    }),
  );
}

export async function POST(request: NextRequest) {
  const { claims, error } = await requireUser(request);
  if (error) return error;

  try {
    const { productId } = z
      .object({ productId: z.number().int().positive() })
      .parse(await request.json());
    const exists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!exists)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: claims.userId, productId } },
      create: { userId: claims.userId, productId },
      update: {},
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    console.error("Wishlist add error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
