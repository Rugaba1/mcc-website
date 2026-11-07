import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const FILE_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".csv": "text/csv; charset=utf-8",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
};

const UPLOAD_NAME_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i;

export const UPLOAD_STORAGE_DIR = path.resolve(
  process.env.UPLOAD_STORAGE_DIR ??
    path.join(process.cwd(), "storage", "uploads"),
);
const LEGACY_UPLOAD_STORAGE_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
);

function resolveUploadPath(root: string, category: string, fileName: string) {
  if (
    (category !== "images" && category !== "files") ||
    !UPLOAD_NAME_RE.test(fileName) ||
    !FILE_TYPES[path.extname(fileName).toLowerCase()]
  ) {
    throw new Error("Invalid upload path");
  }
  return path.join(root, category, fileName);
}

export async function saveUploadedFile(
  category: "images" | "files",
  fileName: string,
  content: Buffer,
) {
  const filePath = resolveUploadPath(UPLOAD_STORAGE_DIR, category, fileName);
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o750 });
  await writeFile(filePath, content, { flag: "wx", mode: 0o640 });
}

export async function readUploadedFile(segments: string[]) {
  if (segments.length !== 2) throw new Error("Invalid upload path");

  const [category, fileName] = segments;
  const contentType = FILE_TYPES[path.extname(fileName).toLowerCase()];
  if (!contentType) throw new Error("Invalid upload path");

  const paths = [
    resolveUploadPath(UPLOAD_STORAGE_DIR, category, fileName),
    resolveUploadPath(LEGACY_UPLOAD_STORAGE_DIR, category, fileName),
  ];

  for (const filePath of paths) {
    try {
      return { content: await readFile(filePath), contentType };
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }
      throw error;
    }
  }

  return null;
}

export async function deleteUploadedFile(url: string) {
  let pathname: string;
  try {
    pathname = new URL(url, "http://localhost").pathname;
  } catch {
    return;
  }
  const segments = pathname.split("/").filter(Boolean);
  if (segments.shift() !== "uploads" || segments.length !== 2) return;

  for (const root of [UPLOAD_STORAGE_DIR, LEGACY_UPLOAD_STORAGE_DIR]) {
    const filePath = resolveUploadPath(root, segments[0], segments[1]);
    await rm(filePath, { force: true });
  }
}
