import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AvtoJpRow = Record<string, string | number | null | undefined>;

function apiKey() {
  return (
    process.env.AVTOJP_API_KEY ||
    process.env.AJ_API_CODE ||
    process.env.AJ_CODE ||
    ""
  ).trim();
}

function apiBase() {
  return (
    process.env.AVTOJP_API_BASE_URL ||
    "http://87.242.72.57/api/"
  ).trim();
}

function cleanId(value: string) {
  return String(value || "")
    .trim()
    .replace(/^aj-/i, "")
    .replace(/\.htm$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function val(row: AvtoJpRow | null | undefined, key: string) {
  if (!row) return "";
  return String(row[key] ?? row[key.toUpperCase()] ?? row[key.toLowerCase()] ?? "").trim();
}

function sqlValue(value: unknown) {
  return String(value ?? "").replace(/'/g, "''");
}

async function avtojpQuery(sql: string): Promise<AvtoJpRow[]> {
  const key = apiKey();

  if (!key) {
    throw new Error("AVTOJP_API_KEY is not configured");
  }

  const url = new URL(apiBase());
  url.searchParams.set("ip", process.env.AVTOJP_API_IP || "8.1.1.1");
  url.searchParams.set("json", "");
  url.searchParams.set("code", key);
  url.searchParams.set("sql", sql);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "MosaicAuto/1.0",
      },
    });

    const raw = (await res.text()).replace(/\0/g, "").trim();
    const startPositions = [raw.indexOf("["), raw.indexOf("{")].filter((i) => i >= 0);
    const start = startPositions.length ? Math.min(...startPositions) : -1;
    const clean = start >= 0 ? raw.slice(start) : raw;

    const parsed = JSON.parse(clean);

    if (Array.isArray(parsed)) return parsed as AvtoJpRow[];

    if (parsed && typeof parsed === "object" && "error" in parsed) {
      throw new Error(String((parsed as { error?: unknown }).error || "AVTOJP error"));
    }

    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function findLot(id: string) {
  const mainRows = await avtojpQuery(`select * from main where id='${sqlValue(id)}' limit 1`);
  if (mainRows[0]) return { row: mainRows[0], source: "main" };

  const statsRows = await avtojpQuery(`select * from stats where id='${sqlValue(id)}' limit 1`);
  if (statsRows[0]) return { row: statsRows[0], source: "stats" };

  return null;
}

function lotPayload(row: AvtoJpRow) {
  return {
    id: val(row, "ID"),
    lot: val(row, "LOT"),
    auction: val(row, "AUCTION"),
    auctionDate: val(row, "AUCTION_DATE"),
    brand: val(row, "MARKA_NAME"),
    model: val(row, "MODEL_NAME"),
    markaId: val(row, "MARKA_ID"),
    modelId: val(row, "MODEL_ID"),
    year: val(row, "YEAR"),
    body: val(row, "KUZOV"),
    grade: val(row, "GRADE"),
    mileage: val(row, "MILEAGE"),
    engineCc: val(row, "ENG_V"),
    power: val(row, "PW"),
    transmission: val(row, "KPP"),
    drive: val(row, "PRIV"),
    finish: val(row, "FINISH"),
  };
}

function factoryCatalogUnavailablePayload(params: {
  id: string;
  lotSource: string;
  lot: AvtoJpRow;
}) {
  return {
    ok: false,
    unavailable: true,
    source: "avtojp-api",
    catalogSource: "official-cars-catalogue-not-configured",
    exactFactoryCatalog: false,
    id: params.id,
    lotSource: params.lotSource,
    lot: lotPayload(params.lot),
    total: 0,
    items: [],
    error: "Каталог временно недоступен",
    safeError:
      "Official Cars catalogue endpoint is not configured. Required provider file: /japan/search.php copied from https://ajes.com/api/search with Cars catalogue support.",
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = cleanId(params.id);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 }
      );
    }

    const found = await findLot(id);

    if (!found) {
      return NextResponse.json(
        { ok: false, id, error: "lot not found in AVTO.JP main/stats" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      factoryCatalogUnavailablePayload({ id, lotSource: found.source, lot: found.row }),
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
