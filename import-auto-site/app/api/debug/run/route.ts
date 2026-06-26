import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function fetchText(url: string) {
  const started = Date.now();

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    let json: unknown = null;

    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }

    return {
      ok: res.ok,
      status: res.status,
      durationMs: Date.now() - started,
      url,
      textPreview: text.slice(0, 2500),
      json,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      url,
      error: String(error),
      json: null,
    };
  }
}

function hasSizeParam(url: string, key: "h" | "w", value: string) {
  return new RegExp(`[?&]${key}=${value}(?:$|[?&])`, "i").test(String(url || ""));
}

function hasAnySizeParam(url: string) {
  return /[?&][hw]=\d+/i.test(String(url || ""));
}

function hasBrokenDoubleSize(url: string) {
  const text = String(url || "");

  return (
    text.includes("?h=50?h=50") ||
    text.includes("?h=50?w=320") ||
    text.includes("&h=50?h=50") ||
    text.includes("&h=50?w=320") ||
    text.includes("&w=320?h=50") ||
    text.includes("&w=320?w=320")
  );
}

function analyzeCatalogImages(catalogJson: any) {
  const items = Array.isArray(catalogJson?.items) ? catalogJson.items : [];

  const cars = items.map((car: any) => {
    const first = Array.isArray(car?.images) ? car.images[0] : null;

    const previewImage = String(car?.previewImage || "");
    const preview = String(first?.preview || "");
    const medium = String(first?.medium || "");
    const original = String(first?.original || "");

    const checks = {
      hasPreviewImage: Boolean(previewImage),
      hasImages: Array.isArray(car?.images) && car.images.length > 0,

      previewUsesH50: hasSizeParam(preview, "h", "50"),
      mediumUsesW320: hasSizeParam(medium, "w", "320"),
      originalHasNoSize: Boolean(original) && !hasAnySizeParam(original),

      previewImageUsesH50: hasSizeParam(previewImage, "h", "50"),

      previewNotMalformed: Boolean(preview) && !hasBrokenDoubleSize(preview),
      mediumNotMalformed: Boolean(medium) && !hasBrokenDoubleSize(medium),
      originalNotMalformed: Boolean(original) && !hasBrokenDoubleSize(original),
      previewImageNotMalformed: Boolean(previewImage) && !hasBrokenDoubleSize(previewImage),
    };

    return {
      id: car?.id || null,
      brand: car?.brand || null,
      model: car?.model || null,
      lot: car?.lot || null,
      previewImage,
      imagesCount: car?.imagesCount || 0,
      firstImage: first,
      checks,
      ok: Object.values(checks).every(Boolean),
    };
  });

  const problems = cars.filter((x: any) => !x.ok);

  return {
    summary: {
      totalItemsChecked: cars.length,
      okItems: cars.filter((x: any) => x.ok).length,
      problemItems: problems.length,

      withImages: cars.filter((x: any) => x.checks.hasImages).length,
      withPreviewImage: cars.filter((x: any) => x.checks.hasPreviewImage).length,

      previewH50Ok: cars.filter((x: any) => x.checks.previewUsesH50).length,
      mediumW320Ok: cars.filter((x: any) => x.checks.mediumUsesW320).length,
      originalNoSizeOk: cars.filter((x: any) => x.checks.originalHasNoSize).length,

      malformedPreview: cars.filter((x: any) => !x.checks.previewNotMalformed).length,
      malformedMedium: cars.filter((x: any) => !x.checks.mediumNotMalformed).length,
      malformedOriginal: cars.filter((x: any) => !x.checks.originalNotMalformed).length,
      malformedPreviewImage: cars.filter((x: any) => !x.checks.previewImageNotMalformed).length,

      verdict: problems.length === 0 ? "OK" : "HAS_IMAGE_URL_PROBLEMS",
      problems,
    },
    cars,
  };
}

function catalogSummary(response: any) {
  const json = response?.json;
  const items = Array.isArray(json?.items) ? json.items : [];

  return {
    httpOk: Boolean(response?.ok),
    status: response?.status,
    durationMs: response?.durationMs,
    apiOk: Boolean(json?.ok),
    page: json?.page ?? null,
    limit: json?.limit ?? null,
    total: json?.total ?? null,
    pages: json?.pages ?? null,
    itemsCount: items.length,
    meta: json?.meta || null,
    hasMeta: Boolean(json?.meta),
    firstCar: items[0]
      ? {
          id: items[0].id,
          brand: items[0].brand,
          model: items[0].model,
          lot: items[0].lot,
          year: items[0].year,
          previewImage: items[0].previewImage,
          imagesCount: items[0].imagesCount,
        }
      : null,
  };
}

function catalogDebugSummary(response: any) {
  const json = response?.json;

  return {
    ...catalogSummary(response),
    hasDebug: Boolean(json?.debug),
    hasWhereSql: Boolean(json?.debug?.whereSql !== undefined),
    hasCountSql: Boolean(json?.debug?.countSql),
    hasItemsSql: Boolean(json?.debug?.itemsSql),
    debug: json?.debug || null,
  };
}

function brandsSummary(response: any) {
  const data = Array.isArray(response?.json?.data)
    ? response.json.data
    : Array.isArray(response?.json?.items)
      ? response.json.items
      : [];

  return {
    httpOk: Boolean(response?.ok),
    status: response?.status,
    durationMs: response?.durationMs,
    count: data.length,
    firstFive: data.slice(0, 5),
    hasToyota: data.some((x: any) => String(x?.name || "").toUpperCase() === "TOYOTA"),
  };
}


function dictionaryDebugSummary(response: any) {
  const json = response?.json;
  const data = Array.isArray(json?.data) ? json.data : [];

  return {
    httpOk: Boolean(response?.ok),
    status: response?.status,
    durationMs: response?.durationMs,
    apiOk: Boolean(json?.ok),
    count: data.length,
    hasMeta: Boolean(json?.meta),
    hasDebug: Boolean(json?.debug),
    hasSql: Boolean(json?.debug?.sql),
    meta: json?.meta || null,
    debug: json?.debug || null,
    firstFive: data.slice(0, 5),
  };
}

async function runDictionariesFlow(baseUrl: string) {
  const brands = await fetchText(`${baseUrl}/api/brands?debug=1`);
  const modelsToyota = await fetchText(`${baseUrl}/api/models?brand=TOYOTA&debug=1`);
  const modelsEmpty = await fetchText(`${baseUrl}/api/models?debug=1`);

  const brandsData = dictionaryDebugSummary(brands);
  const modelsToyotaData = dictionaryDebugSummary(modelsToyota);
  const modelsEmptyData = dictionaryDebugSummary(modelsEmpty);

  const checks = {
    brandsOk: brands.ok && brandsData.apiOk && brandsData.count > 0,
    brandsMetaOk: brandsData.hasMeta,
    brandsDebugOk: brandsData.hasDebug && brandsData.hasSql,

    modelsToyotaOk: modelsToyota.ok && modelsToyotaData.apiOk && modelsToyotaData.count > 0,
    modelsToyotaMetaOk: modelsToyotaData.hasMeta,
    modelsToyotaDebugOk: modelsToyotaData.hasDebug && modelsToyotaData.hasSql,

    modelsEmptyOk: modelsEmpty.ok && modelsEmptyData.apiOk && modelsEmptyData.count > 0,
  };

  return {
    verdict: Object.values(checks).every(Boolean) ? "OK" : "HAS_DICTIONARY_PROBLEMS",
    checks,
    brands: brandsData,
    modelsToyota: modelsToyotaData,
    modelsEmpty: modelsEmptyData,
    raw: {
      brands,
      modelsToyota,
      modelsEmpty,
    },
  };
}

function modelsSummary(response: any) {
  const data = Array.isArray(response?.json?.data)
    ? response.json.data
    : Array.isArray(response?.json?.items)
      ? response.json.items
      : [];

  return {
    httpOk: Boolean(response?.ok),
    status: response?.status,
    durationMs: response?.durationMs,
    count: data.length,
    firstFive: data.slice(0, 5),
  };
}

async function runCatalogFlow(baseUrl: string) {
  const brands = await fetchText(`${baseUrl}/api/brands`);
  const modelsToyota = await fetchText(`${baseUrl}/api/models?brand=TOYOTA`);
  const catalogFirstPage = await fetchText(`${baseUrl}/api/catalog?page=1&limit=5`);
  const catalogDebug = await fetchText(`${baseUrl}/api/catalog?debug=1&page=1&limit=3`);
  const catalogToyota = await fetchText(`${baseUrl}/api/catalog?brand=TOYOTA&page=1&limit=5`);
  const catalogSearch = await fetchText(`${baseUrl}/api/catalog?q=crown&page=1&limit=5`);
  const catalogYear = await fetchText(`${baseUrl}/api/catalog?yearFrom=2020&yearTo=2026&page=1&limit=5`);

  const images = analyzeCatalogImages(catalogFirstPage.json);

  const catalogFirstPageSummary = catalogSummary(catalogFirstPage);
  const catalogDebugData = catalogDebugSummary(catalogDebug);

  const checks = {
    brandsOk: brands.ok && brandsSummary(brands).count > 0,
    modelsOk: modelsToyota.ok,
    catalogOk: catalogFirstPage.ok && catalogFirstPageSummary.itemsCount > 0,
    catalogMetaOk: Boolean(catalogFirstPageSummary.hasMeta),
    catalogDebugOk:
      catalogDebug.ok &&
      catalogDebugData.hasDebug &&
      catalogDebugData.hasCountSql &&
      catalogDebugData.hasItemsSql,
    catalogToyotaOk: catalogToyota.ok,
    catalogSearchOk: catalogSearch.ok,
    catalogYearOk: catalogYear.ok,
    imagesOk: images.summary.verdict === "OK",
    imageServiceOk: images.summary.verdict === "OK",
    dictionariesOk: true,
  };

  return {
    verdict: Object.values(checks).every(Boolean) ? "OK" : "HAS_CATALOG_FLOW_PROBLEMS",
    checks,
    brands: brandsSummary(brands),
    modelsToyota: modelsSummary(modelsToyota),
    catalogFirstPage: catalogFirstPageSummary,
    catalogDebug: catalogDebugData,
    catalogToyota: catalogSummary(catalogToyota),
    catalogSearch: catalogSummary(catalogSearch),
    catalogYear: catalogSummary(catalogYear),
    images: images.summary,
    raw: {
      brands,
      modelsToyota,
      catalogFirstPage,
      catalogDebug,
      catalogToyota,
      catalogSearch,
      catalogYear,
    },
  };
}

async function runTest(req: NextRequest, forcedTest?: string) {
  const url = new URL(req.url);
  const test = forcedTest || url.searchParams.get("test") || "all";

  const port = process.env.PORT || "3000";
  const baseUrl = process.env.DEBUG_INTERNAL_BASE_URL || `http://127.0.0.1:${port}`;

  const result: Record<string, unknown> = {};

  if (test === "api" || test === "all") {
    result.apiDebug = await fetchText(`${baseUrl}/api/debug`);
  }

  if (test === "brands" || test === "all") {
    result.brands = await fetchText(`${baseUrl}/api/brands`);
  }

  if (test === "catalog" || test === "all") {
    result.catalog = await fetchText(`${baseUrl}/api/catalog?page=1&limit=5`);
  }

  if (test === "catalog-debug" || test === "all") {
    result.catalogDebug = await fetchText(`${baseUrl}/api/catalog?debug=1&page=1&limit=3`);
  }

  if (test === "catalog-flow" || test === "all") {
    result.catalogFlow = await runCatalogFlow(baseUrl);
  }

  if (test === "dictionaries" || test === "all") {
    result.dictionaries = await runDictionariesFlow(baseUrl);
  }

  if (test === "currency" || test === "all") {
    result.currency = await fetchText(`${baseUrl}/api/currency`);
  }

  if (test === "images" || test === "all") {
    const catalog = await fetchText(`${baseUrl}/api/catalog?page=1&limit=10`);

    result.images = {
      source: catalog,
      analysis: analyzeCatalogImages(catalog.json),
    };
  }

  return NextResponse.json({
    ok: true,
    version: "DEBUG RUN V2.10",
    checkedAt: new Date().toISOString(),
    test,
    baseUrl,
    result,
  });
}

export async function GET(req: NextRequest) {
  return runTest(req);
}

export async function POST(req: NextRequest) {
  let body: any = {};

  try {
    body = await req.json();
  } catch {}

  return runTest(req, body?.test || "all");
}
