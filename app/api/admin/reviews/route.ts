import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";
import { sendCustomerNotificationEmail } from "@/lib/email";

const PAGE_SIZE = 10;
const moderateSchema = z.object({
  id: z.number().int().positive(),
  approved: z.boolean(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireStaff(request);
  if (error) return error;

  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? 1);
  const page = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const status = request.nextUrl.searchParams.get("status") ?? "pending";
  if (!["pending", "approved", "all"].includes(status))
    return NextResponse.json(
      { error: "Invalid review status" },
      { status: 400 },
    );

  const where = status === "all" ? {} : { approved: status === "approved" };
  try {
    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          productId: true,
          rating: true,
          title: true,
          body: true,
          approved: true,
          createdAt: true,
          product: { select: { name: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
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
    });
  } catch (cause) {
    console.error("GET /api/admin/reviews:", cause);
    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { claims, error } = await requireStaff(request);
  if (error) return error;

  const parsed = moderateSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review update" },
      { status: 400 },
    );

  try {
    const review = await prisma.review.update({
      where: { id: parsed.data.id },
      data: { approved: parsed.data.approved },
      select: {
        id: true,
        approved: true,
        title: true,
        user: { select: { firstName: true, email: true } },
        product: { select: { name: true } },
      },
    });
    if (review.approved) {
      await sendCustomerNotificationEmail({
        to: review.user.email,
        firstName: review.user.firstName,
        subject: "Your product review is published",
        message: `Your review${review.title ? ` “${review.title}”` : ""} for ${review.product.name} has been approved and is now visible on the product page.`,
      });
    }
    return NextResponse.json({
      id: review.id,
      approved: review.approved,
      changedById: claims.userId,
    });
  } catch (cause) {
    if ((cause as { code?: string })?.code === "P2025")
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    console.error("PATCH /api/admin/reviews:", cause);
    return NextResponse.json(
      { error: "Failed to moderate review" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireStaff(request);
  if (error) return error;

  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1)
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });

  try {
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    if ((cause as { code?: string })?.code === "P2025")
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    console.error("DELETE /api/admin/reviews:", cause);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 },
    );
  }
}
