import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// ── GET /api/visualizer/designs?token=xxx ─────────────────────────────────────
export async function GET(req: NextRequest) {
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
    return NextResponse.json({ error: "Failed to load design" }, { status: 500 });
  }
}

// ── POST /api/visualizer/designs ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sceneId, name, previewImage, items, sessionId } = body;

    const shareToken = crypto.randomBytes(16).toString("hex");

    const design = await prisma.visualizerDesign.create({
      data: {
        sceneId: sceneId ? Number(sceneId) : null,
        name: name || "My Room Design",
        shareToken,
        previewImage: previewImage || null,
        sessionId: sessionId || null,
        items: {
          create: (items || []).filter((item: any) => item.variantId).map((item: any) => ({
            variantId: Number(item.variantId),
            surfaceKey: String(item.surfaceKey || item.sortOrder),
            groutColor: item.groutColor || null,
            rotation: Number(item.rotation || 0),
            layout: item.layout || "straight",
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      shareToken: design.shareToken,
      designId: design.id,
      shareUrl: `/visualizer?design=${design.shareToken}`,
    }, { status: 201 });
  } catch (err) {
    console.error("POST /api/visualizer/designs error:", err);
    return NextResponse.json({ error: "Failed to save design" }, { status: 500 });
  }
}
