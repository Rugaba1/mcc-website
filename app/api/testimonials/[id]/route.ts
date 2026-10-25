import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

export const PUT = withPermission(PERM.TESTIMONIALS_MANAGE)(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const row = await prisma.testimonial.update({
      where: { id: Number(id) },
      data: {
        text: body.text,
        name: body.name,
        role: body.role ?? "",
        initials: body.initials ?? "",
      },
    });
    return NextResponse.json(row);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update testimonial" },
      { status: 500 },
    );
  }
  },
);

export const DELETE = withPermission(PERM.TESTIMONIALS_MANAGE)(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
  try {
    const { id } = await params;
    await prisma.testimonial.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete testimonial" },
      { status: 500 },
    );
  }
  },
);
