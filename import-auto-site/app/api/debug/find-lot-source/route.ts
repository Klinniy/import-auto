import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function safeFetchJson(url: string) {
  try {
    const started = Date.now();
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { rawText: text.slice(0, 1000) };
    }

    return {
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - started,
      url,
      json,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      error: String(error),
    };
  }
}

function findById(value: unknown, id: string, path = "root", out: Array<{ path: string; item: unknown }> = []) {
  if (!value) return out;

  if (Array.isArray(value)) {
    value.forEach((item, index) => findById(item, id, `${path}[${index}]`, out));
    return out;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    const objId = String(obj.id || obj.ID || obj.lotId || obj.LOT_ID || "");
    const lot = String(obj.lot || obj.LOT || obj.lotNo || obj.LOT_NO || "");

    if (objId === id || lot === id) {
      out.push({ path, item: obj });
    }

    for (const [key, item] of Object.entries(obj)) {
      if (item && typeof item === "object") {
        findById(item, id, `${path}.${key}`, out);
      }
    }
  }

  return out;
}

function imageUrls(value: unknown, path = "root", out: Array<{ path: string; value: string }> = []) {
  if (!value) return out;

  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    out.push({ path, value });
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => imageUrls(item, `${path}[${index}]`, out));
    return out;
  }

  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      imageUrls(item, `${path}.${key}`, out);
    }
  }

  return out;
}

async function readText(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "hDQ3x6CgmVwXC1";
  const baseUrl = `http://127.0.0.1:${process.env.PORT || 3000}`;

  const requests = [
    `/api/car/${encodeURIComponent(id)}`,
    `/api/catalog?id=${encodeURIComponent(id)}&limit=20`,
    `/api/catalog?q=${encodeURIComponent(id)}&limit=20`,
    `/api/catalog?limit=50`,
    `/api/catalog?brand=DAIHATSU&model=__any__&limit=50`,
  ];

  const results = [];

  for (const path of requests) {
    const result = await safeFetchJson(`${baseUrl}${path}`);
    const matches = findById(result.json, id);
    const images = imageUrls(result.json);

    results.push({
      path,
      ok: result.ok,
      status: result.status,
      durationMs: result.durationMs,
      topLevelKeys:
        result.json && typeof result.json === "object"
          ? Object.keys(result.json as Record<string, unknown>)
          : [],
      matchesCount: matches.length,
      matches: matches.slice(0, 3),
      imageCount: images.length,
      images: images.slice(0, 20),
      preview: result.json,
    });
  }

  const catalogPage = await readText("app/catalog/[id]/page.tsx");
  const carRoute = await readText("app/api/car/[id]/route.ts");
  const catalogRoute = await readText("app/api/catalog/route.ts");

  return NextResponse.json({
    ok: true,
    version: "FIND LOT SOURCE V1",
    checkedAt: new Date().toISOString(),
    id,
    results,
    codeHints: {
      detailPageUsesApiCar: catalogPage.includes("/api/car/"),
      carRouteExists: carRoute.length > 100,
      carRouteMentionsAjesSql: carRoute.includes("ajesSql"),
      catalogRouteExists: catalogRoute.length > 100,
      catalogRouteMentionsIdFilter: catalogRoute.includes("id") || catalogRoute.includes("ID"),
    },
  });
}
