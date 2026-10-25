import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

// ── PUT /api/projects/:id ─────────────────────────────────────────────────────
export const PUT = withPermission(PERM.PROJECTS_MANAGE)(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const numId = Number(id);
    if (isNaN(numId))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    // Atomic: delete old tiles + update project in a single transaction
    const [, project] = await prisma.$transaction([
      prisma.projectTile.deleteMany({ where: { projectId: numId } }),
      prisma.project.update({
        where: { id: numId },
        data: {
          title: body.title ?? "",
          type: body.type ?? "Other",
          description: body.description ?? "",
          gradient: body.gradient ?? "",
          image: body.image ?? "",
          large: body.large ?? false,
          location: body.location ?? "",
          area: body.area ?? "",
          year: body.year ?? "",
          tiles: {
            create: (body.tileIds ?? []).map((pid: number) => ({
              productId: pid,
            })),
          },
        },
        include: { tiles: true },
      }),
    ]);

    return NextResponse.json({
      ...project,
      tileIds: project.tiles.map((t) => t.productId),
    });
  } catch (err: unknown) {
    console.error("PUT /api/projects/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
  },
);

// ── DELETE /api/projects/:id ──────────────────────────────────────────────────
export const DELETE = withPermission(PERM.PROJECTS_MANAGE)(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("DELETE /api/projects/[id]:", err);
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "P2025"
    )
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
  },
);
