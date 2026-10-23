import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";

export async function GET(request: NextRequest) {
  const { error } = await requireStaff(request);
  if (error) return error;

  try {
    const designs = await prisma.visualizerDesign.findMany({
      take: 500,
      orderBy: { updatedAt: "desc" },
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
    return NextResponse.json(designs);
  } catch (cause) {
    console.error("GET /api/admin/visualizer/designs:", cause);
    return NextResponse.json(
      { error: "Failed to load saved designs" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { error } = await requireStaff(request);
  if (error) return error;

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
}
