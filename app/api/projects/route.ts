import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET /api/projects ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  console.log(searchParams.values());

  const type = searchParams.get("activeType");

const selectedProject = searchParams.get("selectedProject");
  const where: any = {};

  if (type && type !== "All" && type !== 'undefined') {
    where.type = type;
  }

    if (selectedProject  && selectedProject !== 'undefined') {
      where.id = parseInt(selectedProject);
    }
  try {
    const rows = await prisma.project.findMany({
      where,
      orderBy: { id: "asc" },

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
    return NextResponse.json(projects);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

// ── POST /api/projects ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
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
}
