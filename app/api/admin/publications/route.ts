import { NextRequest, NextResponse } from "next/server";

import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { publicationData, publicationSchema, uniquePublicationSlug } from "@/lib/publication";
import { prisma } from "@/lib/prisma";

export const GET = withPermission(PERM.PUBLICATIONS_MANAGE)(
  async (_request: NextRequest) => {
    try {
      const publications = await prisma.publication.findMany({
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json(publications);
    } catch (error) {
      console.error("GET /api/admin/publications failed:", error);
      return NextResponse.json({ error: "Could not load publications" }, { status: 500 });
    }
  },
);

export const POST = withPermission(PERM.PUBLICATIONS_MANAGE)(
  async (request: NextRequest) => {
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
      const publication = await prisma.publication.create({
        data: publicationData(
          parsed.data,
          await uniquePublicationSlug(parsed.data.title),
        ),
      });
      return NextResponse.json(publication, { status: 201 });
    } catch (error) {
      console.error("POST /api/admin/publications failed:", error);
      return NextResponse.json({ error: "Could not create publication" }, { status: 500 });
    }
  },
);
