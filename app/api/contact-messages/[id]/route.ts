import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";

export const runtime = "nodejs";

const bodySchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]),
});

async function parseId(params: Promise<{ id: string }>) {
  const id = Number((await params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export const PUT = withPermission(PERM.MESSAGES_MANAGE)(
  async (request: NextRequest, context) => {
  const id = await parseId(context.params!);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    const { status } = bodySchema.parse(await request.json());
    const row = await prisma.contactMessage.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
    return NextResponse.json(row);
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    if ((e as { code?: string })?.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("Contact update error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
  },
);

export const DELETE = withPermission(PERM.MESSAGES_MANAGE)(
  async (request: NextRequest, context) => {
  const id = await parseId(context.params!);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await prisma.contactMessage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2025")
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("Contact delete error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
