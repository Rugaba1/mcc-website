import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join, normalize, sep } from "path";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/require-staff";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  alt: z.string().trim().max(255).nullable().optional(),
});

const parseId = async (ctx: Ctx) => {
  const id = Number((await ctx.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { error } = await requireStaff(req);
  if (error) return error;
  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const data = schema.parse(await req.json());
    return NextResponse.json(await prisma.mediaFile.update({ where: { id }, data }));
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    if ((e as { code?: string })?.code === "P2025") return NextResponse.json({ error: "File not found" }, { status: 404 });
    console.error("PATCH /api/files/[id]:", e);
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { error } = await requireStaff(req);
  if (error) return error;
  const id = await parseId(ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const row = await prisma.mediaFile.delete({ where: { id } });
    const root = join(process.cwd(), "public", "uploads");
    const full = normalize(join(process.cwd(), "public", row.url));
    if (full.startsWith(root + sep)) await unlink(full).catch(() => {}); // already gone is fine
    return NextResponse.json({ ok: true });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return NextResponse.json({ error: "File not found" }, { status: 404 });
    console.error("DELETE /api/files/[id]:", e);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}