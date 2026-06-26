import { readFile } from "fs/promises";
import path from "path";

const contentTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: fileParts } = await context.params;

  const safeParts = fileParts.filter((part) => !part.includes(".."));
  const filePath = path.join(process.cwd(), "public", "mosaic", ...safeParts);
  const ext = path.extname(filePath).toLowerCase();

  try {
    const file = await readFile(filePath);

    return new Response(file, {
      headers: {
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
