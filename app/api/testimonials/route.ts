import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { PERM } from "@/lib/permissions/catalog";
import type { Prisma } from "@/lib/generated/prisma/client";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (req: NextRequest) => {
  try {
    const pagination = parsePagination(req.nextUrl.searchParams);
    if (!pagination) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }
    const where: Prisma.TestimonialWhereInput = pagination.search
      ? {
          OR: [
            { name: { contains: pagination.search } },
            { role: { contains: pagination.search } },
            { text: { contains: pagination.search } },
          ],
        }
      : {};
    let total = 0;
    let page = pagination.page;
    if (pagination.requested) {
      total = await prisma.testimonial.count({ where });
      page = pageForTotal(total, pagination.page, pagination.pageSize).page;
    }
    const rows = await prisma.testimonial.findMany({
      where,
      orderBy: { id: "asc" },
      ...(pagination.requested
        ? { skip: (page - 1) * pagination.pageSize, take: pagination.pageSize }
        : {}),
    });
    return NextResponse.json(
      pagination.requested
        ? paginatedResult(rows, total, page, pagination.pageSize)
        : rows,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 },
    );
  }
});

export const POST = withPermission(PERM.TESTIMONIALS_MANAGE)(
  async (req: NextRequest) => {
  try {
    const body = await req.json();
    const last = await prisma.testimonial.findFirst({
      orderBy: { id: "desc" },
    });
    const nextId = (last?.id || 0) + 1;
    const row = await prisma.testimonial.create({
      data: {
        id: nextId,
        text: body.text,
        name: body.name,
        role: body.role ?? "",
        initials: body.initials ?? "",
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500 },
    );
  }
  },
);
