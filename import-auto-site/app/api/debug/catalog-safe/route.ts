import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function check(url: string) {
  const started = Date.now();

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();

    return {
      ok: res.ok && Boolean(json?.ok),
      status: res.status,
      durationMs: Date.now() - started,
      url,
      total: json?.total ?? null,
      pages: json?.pages ?? null,
      itemsCount: Array.isArray(json?.items) ? json.items.length : 0,
      first: Array.isArray(json?.items) ? json.items[0] || null : null,
      debug: json?.debug || null,
      error: json?.error || null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      url,
      error: String(error),
    };
  }
}

export async function GET() {
  const port = process.env.PORT || "3000";
  const baseUrl = process.env.DEBUG_INTERNAL_BASE_URL || `http://127.0.0.1:${port}`;

  const tests = {
    base: await check(`${baseUrl}/api/catalog?page=1&limit=5&debug=1`),
    brand: await check(`${baseUrl}/api/catalog?brand=TOYOTA&page=1&limit=5&debug=1`),
    brandModel: await check(`${baseUrl}/api/catalog?brand=TOYOTA&model=CROWN&page=1&limit=5&debug=1`),
    year: await check(`${baseUrl}/api/catalog?yearFrom=2020&yearTo=2026&page=1&limit=5&debug=1`),
    mileage: await check(`${baseUrl}/api/catalog?mileageTo=50000&page=1&limit=5&debug=1`),
    rate: await check(`${baseUrl}/api/catalog?rateFrom=4&page=1&limit=5&debug=1`),
    auction: await check(`${baseUrl}/api/catalog?auction=Aux%20Mobility&page=1&limit=5&debug=1`),
    transmission: await check(`${baseUrl}/api/catalog?transmission=AT&page=1&limit=5&debug=1`),
    color: await check(`${baseUrl}/api/catalog?color=black&page=1&limit=5&debug=1`),
    body: await check(`${baseUrl}/api/catalog?body=FE0&page=1&limit=5&debug=1`),
    drive: await check(`${baseUrl}/api/catalog?drive=FF&page=1&limit=5&debug=1`),
    statusSold: await check(`${baseUrl}/api/catalog?status=sold&page=1&limit=5&debug=1`),
    sanction: await check(`${baseUrl}/api/catalog?sanction=1&page=1&limit=5&debug=1`),
    leftHandDrive: await check(`${baseUrl}/api/catalog?leftHandDrive=1&page=1&limit=5&debug=1`),
    sortYear: await check(`${baseUrl}/api/catalog?sort=year_desc&page=1&limit=5&debug=1`),
    sortMileage: await check(`${baseUrl}/api/catalog?sort=mileage_asc&page=1&limit=5&debug=1`),
  };

  const checks = Object.fromEntries(
    Object.entries(tests).map(([key, value]) => [key, Boolean(value.ok)])
  );

  return NextResponse.json({
    ok: Object.values(checks).every(Boolean),
    version: "CATALOG SAFE FILTERS V2",
    checkedAt: new Date().toISOString(),
    checks,
    tests,
  });
}
