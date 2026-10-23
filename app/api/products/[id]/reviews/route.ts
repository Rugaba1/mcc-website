import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/auth/api-access";
import { requireUser } from "@/lib/auth/require-user";

const PAGE_SIZE = 5;
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional().default(""),
  body: z.string().trim().min(3).max(4000),
});

type Context = { params: Promise<{ id: string }> };

function productIdOf(id: string) {
  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export async function GET(request: NextRequest, context: Context) {
  const productId = productIdOf((await context.params).id);
  if (!productId)
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const page = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const user = await getApiUser(request);

  try {
    const where = { productId, approved: true };
    const [total, aggregate, reviews, myReview, purchase] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      user
        ? prisma.review.findUnique({
            where: { productId_userId: { productId, userId: user.id } },
            select: {
              id: true,
              rating: true,
              title: true,
              body: true,
              approved: true,
            },
          })
        : Promise.resolve(null),
      user
        ? prisma.orderItem.findFirst({
            where: {
              variant: { is: { productId } },
              order: { userId: user.id, paymentStatus: "PAID" },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        ...review,
        author:
          [review.user.firstName, review.user.lastName]
            .filter(Boolean)
            .join(" ") || "Customer",
      })),
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      averageRating: aggregate._avg.rating ?? null,
      authenticated: Boolean(user),
      canReview: Boolean(user && purchase && !myReview),
      myReview,
    });
  } catch (error) {
    console.error("GET /api/products/[id]/reviews:", error);
    return NextResponse.json(
      { error: "Failed to load product reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: Context) {
  const { claims, error } = await requireUser(request);
  if (error) return error;

  const productId = productIdOf((await context.params).id);
  if (!productId)
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const parsed = reviewSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review" },
      { status: 400 },
    );

  try {
    const purchased = await prisma.orderItem.findFirst({
      where: {
        variant: { is: { productId } },
        order: { userId: claims.userId, paymentStatus: "PAID" },
      },
      select: { id: true },
    });
    if (!purchased)
      return NextResponse.json(
        {
          error:
            "Only customers with a paid order for this product can review it",
        },
        { status: 403 },
      );

    const review = await prisma.review.create({
      data: {
        productId,
        userId: claims.userId,
        rating: parsed.data.rating,
        title: parsed.data.title || null,
        body: parsed.data.body,
        approved: false,
      },
      select: { id: true, approved: true },
    });
    return NextResponse.json(
      { ...review, message: "Your review is awaiting moderation." },
      { status: 201 },
    );
  } catch (cause) {
    if ((cause as { code?: string })?.code === "P2002")
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    console.error("POST /api/products/[id]/reviews:", cause);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 },
    );
  }
}
