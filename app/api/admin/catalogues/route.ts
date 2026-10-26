import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

export const GET = withPermission(PERM.CATALOGUES_MANAGE)(
  async (req: NextRequest) => {
    try {
      const pagination = parsePagination(req.nextUrl.searchParams, 15, 100);
      if (!pagination) {
        return NextResponse.json(
          { error: "Invalid pagination parameters" },
          { status: 400 },
        );
      }

      const where: Prisma.CatalogueWhereInput = pagination.search
        ? {
            OR: [
              { title: { contains: pagination.search } },
              { description: { contains: pagination.search } },
              { category: { contains: pagination.search } },
              { year: { contains: pagination.search } },
            ],
          }
        : {};

      const total = await prisma.catalogue.count({ where });
      const { page, totalPages } = pageForTotal(
        total,
        pagination.page,
        pagination.pageSize,
      );
      const items = await prisma.catalogue.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      });

      return NextResponse.json(
        paginatedResult(items, total, page, pagination.pageSize),
      );
    } catch (error) {
      console.error("GET /api/admin/catalogues:", error);
      return NextResponse.json(
        { error: "Failed to fetch catalogues" },
        { status: 500 },
      );
    }
  },
);
