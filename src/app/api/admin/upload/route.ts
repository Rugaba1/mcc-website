import { NextRequest } from "next/server";
import { POST as uploadFile } from "@/app/api/upload/route";

export async function POST(req: NextRequest) {
  return uploadFile(req);
}
