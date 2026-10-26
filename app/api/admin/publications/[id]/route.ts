import { NextRequest, NextResponse } from "next/server";

import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { publicationData, publicationSchema } from "@/lib/publication";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = withPermission(PERM.PUBLICATIONS_MANAGE)(
  async (request: NextRequest, context: RouteContext) => {
    const id = Number((await context.params).id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid publication id" }, { status: 400 });
    }
    try {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
      const parsed = publicationSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid publication" },
          { status: 400 },
        );
      }
      const existing = await prisma.publication.findUnique({
        where: { id },
        select: { id: true, slug: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Publication not found" }, { status: 404 });
      }
      const publication = await prisma.publication.update({
        where: { id },
        data: publicationData(parsed.data, existing.slug),
      });
      return NextResponse.json(publication);
    } catch (error) {
      console.error("PUT /api/admin/publications/[id] failed:", error);
      return NextResponse.json({ error: "Could not update publication" }, { status: 500 });
    }
  },
);

export const DELETE = withPermission(PERM.PUBLICATIONS_MANAGE)(
  async (_request: NextRequest, context: RouteContext) => {
    const id = Number((await context.params).id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid publication id" }, { status: 400 });
    }
    try {
      const result = await prisma.publication.deleteMany({ where: { id } });
      if (result.count === 0) {
        return NextResponse.json({ error: "Publication not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error("DELETE /api/admin/publications/[id] failed:", error);
      return NextResponse.json({ error: "Could not delete publication" }, { status: 500 });
    }
  },
);
