import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  try {
    const designs = await prisma.visualizerDesign.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        shareToken: true,
        previewImage: true,
        createdAt: true,
        updatedAt: true,
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
    return NextResponse.json(designs);
  } catch (cause) {
    console.error("GET /api/me/visualizer/designs:", cause);
    return NextResponse.json(
      { error: "Failed to load saved designs" },
      { status: 500 },
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest, { user }) => {
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1)
    return NextResponse.json({ error: "Invalid design id" }, { status: 400 });

  try {
    const result = await prisma.visualizerDesign.deleteMany({
      where: { id, userId: user.id },
    });
    if (result.count === 0)
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (cause) {
    console.error("DELETE /api/me/visualizer/designs:", cause);
    return NextResponse.json(
      { error: "Failed to delete design" },
      { status: 500 },
    );
  }
});
