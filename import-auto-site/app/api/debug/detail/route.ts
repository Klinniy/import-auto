import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROOT = process.cwd();

function readFile(relPath: string, maxLines = 320) {
  const abs = path.join(ROOT, relPath);

  if (!fs.existsSync(abs)) {
    return {
      path: relPath,
      exists: false,
      preview: "",
    };
  }

  const text = fs.readFileSync(abs, "utf-8");
  const lines = text.split(/\r?\n/);

  return {
    path: relPath,
    exists: true,
    size: Buffer.byteLength(text, "utf-8"),
    lines: lines.length,
    preview: lines.slice(0, maxLines).join("\n"),
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: "DETAIL SCAN V1",
    checkedAt: new Date().toISOString(),
    files: {
      detailPage: readFile("app/catalog/[id]/page.tsx", 420),
      carApi: readFile("app/api/car/[id]/route.ts", 320),
      catalogFull: readFile("components/CatalogFull.tsx", 220),
      catalogMapper: readFile("lib/catalog/mapper.ts", 220),
      catalogImages: readFile("lib/catalog/images.ts", 220),
    },
    nextStep: {
      instruction:
        "Скопируй этот JSON. По нему сделаем нормальную страницу лота /catalog/[id] без перезаписи лишних частей сайта.",
    },
  });
}
