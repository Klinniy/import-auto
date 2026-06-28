import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isImageUrl(value: unknown) {
  return typeof value === "string" && /^https?:\/\//i.test(value) && (
    value.includes("/imgs/") ||
    value.includes("image") ||
    value.includes("photo") ||
    value.includes(".jpg") ||
    value.includes(".jpeg") ||
    value.includes(".png") ||
    value.includes(".webp")
  );
}

function walkImages(value: unknown, path = "root", out: Array<{ path: string; value: unknown }> = []) {
  if (!value) return out;

  if (isImageUrl(value)) {
    out.push({ path, value });
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => walkImages(item, `${path}[${index}]`, out));
    return out;
  }

  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      walkImages(item, `${path}.${key}`, out);
    }
  }

  return out;
}

function flatKeys(value: unknown, prefix = "", out: string[] = []) {
  if (!value || typeof value !== "object") return out;

  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${key}` : key;
    out.push(next);

    if (item && typeof item === "object" && !Array.isArray(item)) {
      flatKeys(item, next, out);
    }
  }

  return out;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({
      ok: false,
      error: "Передай id: /api/debug/detail-lot?id=LOT_ID",
    }, { status: 400 });
  }

  const baseUrl = `http://127.0.0.1:${process.env.PORT || 3000}`;
  const res = await fetch(`${baseUrl}/api/car/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  const payload = await res.json();
  const images = walkImages(payload);
  const keys = flatKeys(payload);

  return NextResponse.json({
    ok: res.ok,
    checkedAt: new Date().toISOString(),
    id,
    status: res.status,
    topLevelKeys: Object.keys(payload || {}),
    keys,
    imageCount: images.length,
    images,
    payloadPreview: payload,
  });
}
