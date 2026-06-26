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

    return {
      url,
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get("content-type"),
      contentLength: res.headers.get("content-length"),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    return {
      url,
      ok: false,
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
        variants,
        checks,
      };
    })
  );

  const summary = {
    checkedCars: cars.length,
    mediumW320Ok: cars.filter((car: any) => car.checks.mediumW320?.ok).length,
    testW480Ok: cars.filter((car: any) => car.checks.testW480?.ok).length,
    testW640Ok: cars.filter((car: any) => car.checks.testW640?.ok).length,
    currentApiMediumOk: cars.filter((car: any) => car.checks.currentApiMedium?.ok).length,
    verdict:
      cars.length > 0 &&
      cars.every((car: any) => car.checks.currentApiMedium?.ok || car.checks.currentApiPreviewImage?.ok)
        ? "OK_CURRENT_API_IMAGES_WORK"
        : "HAS_IMAGE_PROBLEMS",
  };

  return NextResponse.json({
    ok: true,
    version: "IMAGE QUALITY DEBUG V1",
    checkedAt: new Date().toISOString(),
    summary,
    cars,
    conclusion:
      "Если testW640Ok меньше checkedCars, значит нельзя форсировать w=640. Используем рабочий currentApiMedium / mediumW320.",
  });
}
