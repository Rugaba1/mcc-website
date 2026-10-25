import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/middleware/withPermission";
import { PERM } from "@/lib/permissions/catalog";
import { prisma } from "@/lib/prisma";

export const GET = withPermission(PERM.USERS_PERMISSIONS)(
  async (request: NextRequest) => {
    const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json(
        { error: "Search with at least two characters." },
        { status: 400 },
      );
    }

    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query } },
            { firstName: { contains: query } },
            { lastName: { contains: query } },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
        },
        orderBy: [{ firstName: "asc" }, { email: "asc" }],
        take: 10,
      });
      return NextResponse.json({
        users: users.map((user) => ({
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(" "),
          active: user.isActive,
        })),
      });
    } catch (error) {
      console.error("GET /api/admin/blocked-emails/users failed:", error);
      return NextResponse.json(
        { error: "Could not search users." },
        { status: 500 },
      );
    }
  },
);
