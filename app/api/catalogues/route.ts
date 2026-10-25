import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { PERM } from "@/lib/permissions/catalog";

export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (_req: NextRequest) => {
  try {
    const rows = await prisma.catalogue.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/catalogues:", err);
    return NextResponse.json(
      { error: "Failed to fetch catalogues" },
      { status: 500 },
    );
  }
});

export const POST = withPermission(PERM.CATALOGUES_MANAGE)(
  async (req: NextRequest) => {
  try {
    const body = await req.json();
    if (!body.title?.trim())
      return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const row = await prisma.catalogue.create({
      data: {
        title: body.title.trim(),
        description: body.description ?? "",
        coverImage: body.coverImage ?? "",
        fileUrl: body.fileUrl ?? "",
        category: body.category ?? "general",
        year: body.year ?? "",
        published: body.published ?? true,
        featured: body.featured ?? false,
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error("POST /api/catalogues:", err);
    return NextResponse.json(
      { error: "Failed to create catalogue" },
      { status: 500 },
    );
  }
});
