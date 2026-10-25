import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, withOptionalAuth } from "@/lib/middleware/withAuth";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { sendReviewSubmittedAlert } from "@/lib/email";
import { CUSTOMER_PERM, PERM } from "@/lib/permissions/catalog";
import { hasPermissions } from "@/lib/permissions/core";

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

export const GET = withOptionalAuth(
  async (
    request: NextRequest,
    { user, params }: { user: { id: number; permissions: string[] } | null; params: Promise<{ id: string }> },
  ) => {
  const productId = productIdOf((await params).id);
  if (!productId)
    return NextResponse.json({ error: "Invalid product id" }, { status: 400 });

  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const page = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
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
      canReview: Boolean(
        user &&
          hasPermissions(user.permissions, CUSTOMER_PERM.REVIEWS_CREATE) &&
          purchase &&
          !myReview,
      ),
      myReview,
    });
  } catch (error) {
    console.error("GET /api/products/[id]/reviews:", error);
    return NextResponse.json(
      { error: "Failed to load product reviews" },
      { status: 500 },
    );
  }
  },
  { interval: 60_000, uniqueTokenPerInterval: 120 },
);

export const POST = withAuth(async (
  request: NextRequest,
  { user, params }: { user: { id: number; permissions: string[] }; params: Promise<{ id: string }> },
) => {
  if (!hasPermissions(user.permissions, CUSTOMER_PERM.REVIEWS_CREATE))
    return NextResponse.json(
      { error: "Your account is not permitted to submit product reviews." },
      { status: 403 },
    );

  const productId = productIdOf((await params).id);
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
        order: { userId: user.id, paymentStatus: "PAID" },
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

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId,
          userId: user.id,
          rating: parsed.data.rating,
          title: parsed.data.title || null,
          body: parsed.data.body,
          approved: false,
        },
        include: {
          product: { select: { name: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      });
      await tx.adminNotification.create({
        data: {
          type: "review",
          requiredPermission: PERM.REVIEWS_MODERATE,
          title: "Review awaiting moderation",
          message: `${created.product.name} · ${created.rating}/5`,
          targetPath: "/admin/reviews",
          entityId: created.id,
        },
      });
      return created;
    });
    await sendReviewSubmittedAlert({
      name: [review.user.firstName, review.user.lastName]
        .filter(Boolean)
        .join(" ") || "Customer",
      email: review.user.email,
      productName: review.product.name,
      rating: review.rating,
      body: review.body ?? "",
    });
    return NextResponse.json(
      {
        id: review.id,
        approved: review.approved,
        message: "Your review is awaiting moderation.",
      },
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
});
