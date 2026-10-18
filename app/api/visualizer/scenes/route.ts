import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { ALL_ROOM_SCENES } from "../../../../data/scenes";

export async function GET() {
  try {
    const scenes = await prisma.visualizerScene.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });

    if (scenes.length === 0) {
      return NextResponse.json(ALL_ROOM_SCENES);
    }

    const formattedScenes = scenes.map((s) => ({
      id: `scene_${s.id}`,
      dbId: s.id,
      name: s.name,
      category: s.roomType.charAt(0).toUpperCase() + s.roomType.slice(1),
      specifier: `MCC\\Scenes\\${s.name.replace(/\s+/g, "_")}`,
      baseImage: s.image,
      originalSize: { width: 2000, height: 1150 },
      surfaces: typeof s.surfaces === "string" ? JSON.parse(s.surfaces) : s.surfaces,
    }));

    return NextResponse.json(formattedScenes);
  } catch (err) {
    console.error("GET /api/visualizer/scenes error:", err);
    return NextResponse.json(ALL_ROOM_SCENES);
  }
}
