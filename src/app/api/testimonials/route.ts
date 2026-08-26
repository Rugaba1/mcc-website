import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.testimonial.findMany({ orderBy: { id: "asc" } });
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const row  = await prisma.testimonial.create({
      data: {
        text:     body.text,
        name:     body.name,
        role:     body.role     ?? "",
        initials: body.initials ?? "",
      },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
