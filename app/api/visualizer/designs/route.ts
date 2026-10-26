import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOptionalAuth } from "@/lib/middleware/withAuth";
import { withRateLimit } from "@/lib/middleware/withRateLimit";
import crypto from "crypto";
import { z } from "zod";

const saveSchema = z.object({
  sceneId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1).max(150),
  sessionId: z.string().trim().max(100).optional(),
  previewImage: z.string().max(60_000).nullable().optional(),
  items: z
    .array(
      z.object({
        variantId: z.number().int().positive(),
        surfaceKey: z.string().trim().min(1).max(50),
        groutColor: z.string().trim().max(20).nullable().optional(),
        rotation: z.number().int().min(0).max(360).default(0),
        layout: z.string().trim().max(30).nullable().optional(),
      }),
    )
    .max(50),
});

// ── GET /api/visualizer/designs?token=xxx ─────────────────────────────────────
export const GET = withRateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 120,
})(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const design = await prisma.visualizerDesign.findUnique({
      where: { shareToken: token },
      include: {
        scene: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    return NextResponse.json(design);
  } catch (err) {
    console.error("GET /api/visualizer/designs error:", err);
    return NextResponse.json(
      { error: "Failed to load design" },
      { status: 500 },
    );
  }
});

// ── POST /api/visualizer/designs ──────────────────────────────────────────────
export const POST = withOptionalAuth(async (req, { user }) => {
  try {
    const parsed = saveSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid design" },
        { status: 400 },
      );
    }
    const { sceneId, name, items, sessionId, previewImage } = parsed.data;

    const shareToken = crypto.randomBytes(16).toString("hex");

    const design = await prisma.visualizerDesign.create({
      data: {
        userId: user?.id ?? null,
        sessionId: user ? null : sessionId || null,
        sceneId: sceneId ?? null,
        name,
        shareToken,
        previewImage: previewImage ?? null,
        items: {
          create: items.map((item) => ({
            variantId: item.variantId,
            surfaceKey: item.surfaceKey,
            groutColor: item.groutColor || null,
            rotation: item.rotation,
            layout: item.layout || "straight",
          })),
        },
      },
      select: { id: true, shareToken: true },
    });

    return NextResponse.json(
      {
        success: true,
        shareToken: design.shareToken,
        designId: design.id,
        shareUrl: `/visualizer/design/${design.shareToken}`,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/visualizer/designs error:", err);
    return NextResponse.json(
      { error: "Failed to save design" },
      { status: 500 },
    );
  }
}, {
  interval: 60_000,
  uniqueTokenPerInterval: 30,
});

// ── PUT /api/visualizer/designs — update an owned saved design ───────────────
export const PUT = withOptionalAuth(async (req, { user }) => {
  try {
    const bodySchema = saveSchema.extend({
      shareToken: z.string().trim().min(1).max(64),
    });
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid design" },
        { status: 400 },
      );
    }

    const { shareToken, sceneId, name, items, sessionId, previewImage } = parsed.data;
    const existing = await prisma.visualizerDesign.findUnique({
      where: { shareToken },
      select: { id: true, userId: true, sessionId: true },
    });
    if (!existing)
      return NextResponse.json({ error: "Design not found" }, { status: 404 });

    const canUpdate =
      existing.userId !== null
        ? user?.id === existing.userId
        : Boolean(
            sessionId && existing.sessionId && sessionId === existing.sessionId,
          );
    if (!canUpdate)
      return NextResponse.json(
        { error: "You cannot update this design" },
        { status: 403 },
      );

    const updated = await prisma.visualizerDesign.update({
      where: { id: existing.id },
      data: {
        sceneId: sceneId ?? null,
        name,
        previewImage: previewImage ?? null,
        items: {
          deleteMany: {},
          create: items.map((item) => ({
            variantId: item.variantId,
            surfaceKey: item.surfaceKey,
            groutColor: item.groutColor || null,
            rotation: item.rotation,
            layout: item.layout || "straight",
          })),
        },
      },
      select: { id: true, shareToken: true },
    });

    return NextResponse.json({
      success: true,
      designId: updated.id,
      shareToken: updated.shareToken,
      shareUrl: `/visualizer/design/${updated.shareToken}`,
    });
  } catch (err) {
    console.error("PUT /api/visualizer/designs error:", err);
    return NextResponse.json(
      { error: "Failed to update design" },
      { status: 500 },
    );
  }
}, {
  interval: 60_000,
  uniqueTokenPerInterval: 30,
});
