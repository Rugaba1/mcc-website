import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import { PERM } from "@/lib/permissions/catalog";
import type { Prisma } from "@/lib/generated/prisma/client";
import { pageForTotal, paginatedResult, parsePagination } from "@/lib/server-pagination";

// ── GET /api/projects ─────────────────────────────────────────────────────────
export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
})(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const pagination = parsePagination(searchParams);
  if (!pagination) {
    return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
  }
  const type = searchParams.get("activeType");
  const selectedProjectParam = searchParams.get("selectedProject");
  const selectedProject = selectedProjectParam === "undefined" ? null : selectedProjectParam;
  const selectedProjectId = selectedProject ? Number(selectedProject) : undefined;
  if (selectedProject && (!Number.isSafeInteger(selectedProjectId) || Number(selectedProjectId) < 1)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }
  const where: Prisma.ProjectWhereInput = {};

  if (type && type !== "All" && type !== 'undefined') {
    where.type = type;
  }
  if (selectedProjectId) where.id = selectedProjectId;
  if (pagination.search) {
    where.OR = [
      { title: { contains: pagination.search } },
      { type: { contains: pagination.search } },
      { description: { contains: pagination.search } },
      { location: { contains: pagination.search } },
    ];
  }
  try {
    let total = 0;
    let page = pagination.page;
    if (pagination.requested) {
      total = await prisma.project.count({ where });
      page = pageForTotal(total, pagination.page, pagination.pageSize).page;
    }
    const rows = await prisma.project.findMany({
      where,
      orderBy: { id: "asc" },
      ...(pagination.requested
        ? { skip: (page - 1) * pagination.pageSize, take: pagination.pageSize }
        : {}),
      include: {
        tiles: { include: { product: true } },
      },
    });
    const projects = rows.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      description: p.description,
      gradient: p.gradient,
      image: p.image,
      large: p.large,
      location: p.location,
      area: p.area,
      year: p.year,
      tileIds: p.tiles.map((t) => t.productId),
      products: p.tiles,
    }));
    return NextResponse.json(
      pagination.requested
        ? paginatedResult(projects, total, page, pagination.pageSize)
        : projects,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
});

// ── POST /api/projects ────────────────────────────────────────────────────────
export const POST = withPermission(PERM.PROJECTS_MANAGE)(
  async (req: NextRequest) => {
  try {
    const body = await req.json();
    const project = await prisma.project.create({
      data: {
        title: body.title,
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
    });
    return NextResponse.json(
      {
        ...project,
        tileIds: project.tiles.map((t) => t.productId),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
  },
);
