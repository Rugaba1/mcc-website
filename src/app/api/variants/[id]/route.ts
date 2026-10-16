import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";

export const runtime = "nodejs";

const bodySchema = z.object({
  textureUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((u) => u.startsWith("/uploads/") || u.startsWith("https://"), {
      message: "Must be an uploaded file or an https URL",
    })
    .nullable(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireStaff(request);
  if (error) return error;

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const { textureUrl } = bodySchema.parse(await request.json());

    const variant = await prisma.productVariant.update({
      where: { id },
      data: { textureUrl },
      select: { id: true, textureUrl: true },
    });

    return NextResponse.json(variant);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: e.issues }, { status: 400 });
    }
    // P2025: record to update not found
    if ((e as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }
    console.error("Texture update error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}