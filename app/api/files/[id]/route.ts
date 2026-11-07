import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { deleteUploadedFile } from "@/lib/uploads/storage";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  alt: z.string().trim().max(255).nullable().optional(),
  folderId: z.number().int().positive().nullable().optional(),
  isPublic: z.boolean().optional(),
});

const parseId = async (ctx: Ctx) => {
  const id = Number((await ctx.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const PATCH = withPermission(PERM.MEDIA_MANAGE)(
  async (req: NextRequest, context) => {
  const id = await parseId(context as Ctx);
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
  },
);

export const DELETE = withPermission(PERM.MEDIA_DELETE)(
  async (_req: NextRequest, context) => {
  const id = await parseId(context as Ctx);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const row = await prisma.mediaFile.delete({ where: { id } });
    await deleteUploadedFile(row.url);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025") return NextResponse.json({ error: "File not found" }, { status: 404 });
    console.error("DELETE /api/files/[id]:", e);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
});