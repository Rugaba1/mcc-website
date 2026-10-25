import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({ isActive: z.literal(false) }).strict();
type Context = { params: Promise<{ id: string }> };

export const PATCH = withPermission(PERM.USERS_PERMISSIONS)(
  async (request: NextRequest, context: Context & { user: { id: number } }) => {
    try {
      const id = Number((await context.params).id);
      if (!Number.isSafeInteger(id) || id <= 0)
        return NextResponse.json({ error: "Invalid block entry." }, { status: 400 });

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
      }
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json({ error: "Invalid blocklist action." }, { status: 400 });

      const result = await prisma.$transaction(async (tx) => {
        const entry = await tx.emailBlocklist.findUnique({ where: { id } });
        if (!entry) return { missing: true as const };
        if (!entry.isActive) return { entry };

        const updated = await tx.emailBlocklist.update({
          where: { id },
          data: {
            isActive: false,
            revokedAt: new Date(),
            revokedById: context.user.id,
          },
        });
        await tx.emailBlocklistEvent.create({
          data: {
            email: entry.email,
            action: "UNBLOCKED",
            reason: entry.reason,
            actorUserId: context.user.id,
          },
        });
        return { entry: updated };
      });

      if ("missing" in result)
        return NextResponse.json({ error: "Block entry not found." }, { status: 404 });

      return NextResponse.json(result.entry);
    } catch (error) {
      console.error("PATCH /api/admin/blocked-emails/[id]:", error);
      return NextResponse.json(
        { error: "Failed to remove the email block." },
        { status: 500 },
      );
    }
  },
);
