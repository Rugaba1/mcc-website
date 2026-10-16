// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromToken } from "@/lib/auth/auth-helpers";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    

    const resp = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 },
    );
    resp.cookies.delete("refresh_token");
    return resp;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
