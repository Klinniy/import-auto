import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function stripImageSize(url: string) {
  let value = String(url || "").trim();

  if (!value) return "";

  for (let i = 0; i < 5; i++) {
    const next = value
      .replace(/([?&])(h|w)=\d+/gi, "")
      .replace(/\?&/g, "?")
      .replace(/[?&]$/g, "");

    if (next === value) break;

    value = next;
  }

  return value;
}

function isRealImage(check: any) {
  return Boolean(check?.ok && String(check?.contentType || "").startsWith("image/"));
}

async function checkImage(url: string) {
  const started = Date.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        range: "bytes=0-4096",
      },
    });

    const contentType = res.headers.get("content-type");

    return {
      url,
      ok: res.ok,
      isImage: String(contentType || "").startsWith("image/"),
      status: res.status,
      contentType,
      contentLength: res.headers.get("content-length"),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      isImage: false,
      status: 0,
      error: String(error),
      durationMs: Date.now() - started,
    };
  }
}

export async function GET() {
  const port = process.env.PORT || "3000";
  const baseUrl = process.env.DEBUG_INTERNAL_BASE_URL || `http://127.0.0.1:${port}`;

  const catalogRes = await fetch(`${baseUrl}/api/catalog?page=1&limit=5`, {
    cache: "no-store",
  });

  const catalog = await catalogRes.json();
  const items = Array.isArray(catalog?.items) ? catalog.items : [];

  const cars = await Promise.all(
    items.map(async (car: any) => {
      const first = Array.isArray(car.images) ? car.images[0] : null;

      const original = String(first?.original || "");
      const preview = String(first?.preview || car.previewImage || "");
      const medium = String(first?.medium || "");
      const base = stripImageSize(original || medium || preview);

      const variants = {
        original: base,
        previewH50: base ? `${base}&h=50` : "",
        mediumW320: base ? `${base}&w=320` : "",
        testW480: base ? `${base}&w=480` : "",
        testW640: base ? `${base}&w=640` : "",
        currentApiPreviewImage: String(car.previewImage || ""),
        currentApiMedium: medium,
      };

      const checks = {
        original: variants.original ? await checkImage(variants.original) : null,
        previewH50: variants.previewH50 ? await checkImage(variants.previewH50) : null,
        mediumW320: variants.mediumW320 ? await checkImage(variants.mediumW320) : null,
        testW480: variants.testW480 ? await checkImage(variants.testW480) : null,
        testW640: variants.testW640 ? await checkImage(variants.testW640) : null,
        currentApiPreviewImage: variants.currentApiPreviewImage ? await checkImage(variants.currentApiPreviewImage) : null,
        currentApiMedium: variants.currentApiMedium ? await checkImage(variants.currentApiMedium) : null,
      };

      return {
        id: car.id,
        brand: car.brand,
        model: car.model,
        lot: car.lot,
        recommendedForCatalog: isRealImage(checks.original) ? variants.original : variants.currentApiMedium,
        variants,
        checks,
      };
    })
  );

  const summary = {
    checkedCars: cars.length,

    originalImageOk: cars.filter((car: any) => isRealImage(car.checks.original)).length,
    mediumW320ImageOk: cars.filter((car: any) => isRealImage(car.checks.mediumW320)).length,
    testW480ImageOk: cars.filter((car: any) => isRealImage(car.checks.testW480)).length,
    testW640ImageOk: cars.filter((car: any) => isRealImage(car.checks.testW640)).length,
    currentApiMediumImageOk: cars.filter((car: any) => isRealImage(car.checks.currentApiMedium)).length,

    w480ReturnsHtml: cars.filter((car: any) => String(car.checks.testW480?.contentType || "").includes("text/html")).length,
    w640ReturnsHtml: cars.filter((car: any) => String(car.checks.testW640?.contentType || "").includes("text/html")).length,

    verdict:
      cars.length > 0 &&
      cars.every((car: any) => isRealImage(car.checks.original) || isRealImage(car.checks.currentApiMedium))
        ? "OK_USE_ORIGINAL_OR_W320"
        : "HAS_IMAGE_PROBLEMS",

    recommendation:
      "For catalog cards use original JPEG first. Do not force w=480/w=640 because they return text/html, not image.",
  };

  return NextResponse.json({
    ok: true,
    version: "IMAGE QUALITY DEBUG V2",
    checkedAt: new Date().toISOString(),
    summary,
    cars,
  });
}
