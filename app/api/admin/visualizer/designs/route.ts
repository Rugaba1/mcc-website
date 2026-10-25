import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import type { Prisma } from "@/lib/generated/prisma/client";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const GET = withPermission(PERM.VISUALIZER_DESIGNS_VIEW)(
  async (request: NextRequest) => {
  try {
    const pagination = parsePagination(request.nextUrl.searchParams);
    if (!pagination) {
      return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
    }
    const where: Prisma.VisualizerDesignWhereInput = pagination.search
      ? {
          OR: [
            { name: { contains: pagination.search } },
            { user: { is: { firstName: { contains: pagination.search } } } },
            { user: { is: { lastName: { contains: pagination.search } } } },
            { user: { is: { email: { contains: pagination.search } } } },
            { scene: { is: { name: { contains: pagination.search } } } },
            { items: { some: { variant: { product: { name: { contains: pagination.search } } } } } },
          ],
        }
      : {};
    const total = await prisma.visualizerDesign.count({ where });
    const { page } = pageForTotal(total, pagination.page, pagination.pageSize);
    const designs = await prisma.visualizerDesign.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      select: {
        id: true,
        name: true,
        shareToken: true,
        previewImage: true,
        sessionId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        scene: { select: { name: true, roomType: true } },
        items: {
          select: {
            surfaceKey: true,
            rotation: true,
            layout: true,
            variant: {
              select: {
                sku: true,
                size: true,
                product: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    return NextResponse.json(paginatedResult(designs, total, page, pagination.pageSize));
  } catch (cause) {
    console.error("GET /api/admin/visualizer/designs:", cause);
    return NextResponse.json(
      { error: "Failed to load saved designs" },
      { status: 500 },
    );
  }
});

export const DELETE = withPermission(PERM.CONTENT_MANAGE)(
  async (request: NextRequest) => {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1)
    return NextResponse.json({ error: "Invalid design id" }, { status: 400 });

  try {
    const result = await prisma.visualizerDesign.delete({ where: { id } });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (cause) {
    if ((cause as { code?: string })?.code === "P2025")
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    console.error("DELETE /api/admin/visualizer/designs:", cause);
    return NextResponse.json(
      { error: "Failed to delete design" },
      { status: 500 },
    );
  }
});
