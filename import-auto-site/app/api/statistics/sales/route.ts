import { NextRequest, NextResponse } from "next/server";
import { ajesSql, normalizeImages, sqlValue, toInt } from "@/lib/ajes/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RawRow = Record<string, string>;

const STATS_WHERE = "AUCTION_TYPE=2";
const CACHE_TTL_MS = 1000 * 60 * 5;

const countCache = new Map<string, { value: number; expires: number }>();

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function cleanText(value: unknown) {
  return clean(value)
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function num(value: unknown) {
  const raw = String(value ?? "").replace(/[^\d.-]/g, "");
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function firstCount(row: Record<string, unknown> | undefined) {
  if (!row) return 0;

  return num(
    row.CNT ??
      row.cnt ??
      row.TAG0 ??
      row["count(*)"] ??
      row["COUNT(*)"] ??
      Object.values(row)[0]
  );
}

async function safeRows(sql: string) {
  try {
    return await ajesSql<RawRow[]>(sql);
  } catch {
    return [];
  }
}

async function safeCount(sql: string, key: string) {
  const cached = countCache.get(key);

  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }

  const rows = await safeRows(sql);
  const value = firstCount(rows[0]);

  countCache.set(key, {
    value,
    expires: Date.now() + CACHE_TTL_MS,
  });

  return value;
}

function like(value: string) {
  return sqlValue(`%${value}%`);
}

function normalizeStatusValue(value: string) {
  const v = clean(value).toLowerCase();

  if (v === "sold" || v === "продан") return "SOLD";
  if (v === "not_sold" || v === "not sold" || v === "не продан") return "not sold";
  if (v === "removed" || v === "снят") return "removed";
  if (v === "cancelled" || v === "canceled" || v === "отменен") return "Cancelled";

  return value;
}

function addEqual(where: string[], field: string, value: string) {
  if (!value || value === "__any__") return;
  where.push(`${field}=${sqlValue(value)}`);
}

function addLike(where: string[], field: string, value: string) {
  if (!value || value === "__any__") return;
  where.push(`${field} like ${like(value)}`);
}

function addNumberGte(where: string[], field: string, value: number) {
  if (!value) return;
  where.push(`${field}>=${value}`);
}

function addNumberLte(where: string[], field: string, value: number) {
  if (!value) return;
  where.push(`${field}<=${value}`);
}

function buildWhere(params: URLSearchParams) {
  const where: string[] = [STATS_WHERE];

  const brand = clean(params.get("brand") || params.get("marka"));
  const model = clean(params.get("model"));
  const q = clean(params.get("q") || params.get("lot"));

  const yearFrom = toInt(params.get("yearFrom"), 0, 0, 2100);
  const yearTo = toInt(params.get("yearTo"), 0, 0, 2100);
  const mileageFrom = toInt(params.get("mileageFrom"), 0, 0, 9999999);
  const mileageTo = toInt(params.get("mileageTo"), 0, 0, 9999999);
  const engineFrom = toInt(params.get("engineFrom"), 0, 0, 99999);
  const engineTo = toInt(params.get("engineTo"), 0, 0, 99999);

  const auction = clean(params.get("auction"));
  const rateFrom = clean(params.get("rateFrom") || params.get("rate"));
  const body = clean(params.get("body"));
  const color = clean(params.get("color"));
  const transmission = clean(params.get("transmission") || params.get("kpp"));
  const drive = clean(params.get("drive"));
  const status = clean(params.get("status"));
  const sanction = clean(params.get("sanction"));
  const leftHandDrive = clean(params.get("leftHandDrive"));

  addEqual(where, "MARKA_NAME", brand);
  addEqual(where, "MODEL_NAME", model);

  if (q) {
    where.push(
      `(LOT=${sqlValue(q)} or ID=${sqlValue(q)} or MARKA_NAME like ${like(q)} or MODEL_NAME like ${like(q)} or KUZOV like ${like(q)} or AUCTION like ${like(q)} or COLOR like ${like(q)})`
    );
  }

  addNumberGte(where, "YEAR", yearFrom);
  addNumberLte(where, "YEAR", yearTo);
  addNumberGte(where, "MILEAGE", mileageFrom);
  addNumberLte(where, "MILEAGE", mileageTo);
  addNumberGte(where, "ENG_V", engineFrom);
  addNumberLte(where, "ENG_V", engineTo);

  addEqual(where, "AUCTION", auction);
  addLike(where, "KUZOV", body);
  addLike(where, "COLOR", color);
  addEqual(where, "KPP", transmission);
  addEqual(where, "PRIV", drive);

  if (rateFrom) {
    if (["R", "RA", "*", "***"].includes(rateFrom)) {
      addEqual(where, "RATE", rateFrom);
    } else {
      where.push(`RATE>=${sqlValue(rateFrom)}`);
    }
  }

  if (status) {
    addEqual(where, "STATUS", normalizeStatusValue(status));
  }

  if (sanction === "1") where.push("SANCTION=1");
  if (sanction === "0") where.push("SANCTION=0");

  if (leftHandDrive === "1") where.push("LHDRIVE=1");
  if (leftHandDrive === "0") where.push("LHDRIVE=0");

  return where.join(" and ");
}

function orderSql(sort: string) {
  const map: Record<string, string> = {
    date_asc: "AUCTION_DATE asc",
    date_desc: "AUCTION_DATE desc",
    auction_date_asc: "AUCTION_DATE asc",
    auction_date_desc: "AUCTION_DATE desc",

    lot_asc: "LOT asc",
    lot_desc: "LOT desc",

    year_asc: "YEAR asc",
    year_desc: "YEAR desc",

    engine_asc: "ENG_V asc",
    engine_desc: "ENG_V desc",
    volume_asc: "ENG_V asc",
    volume_desc: "ENG_V desc",

    mileage_asc: "MILEAGE asc",
    mileage_desc: "MILEAGE desc",

    rate_asc: "RATE asc",
    rate_desc: "RATE desc",

    start_asc: "START asc",
    start_desc: "START desc",

    finish_asc: "FINISH asc",
    finish_desc: "FINISH desc",
    price_asc: "FINISH asc",
    price_desc: "FINISH desc",

    average_asc: "AVG_PRICE asc",
    average_desc: "AVG_PRICE desc",
    avg_asc: "AVG_PRICE asc",
    avg_desc: "AVG_PRICE desc",
  };

  return map[sort] || "";
}

function statusLabel(value: unknown) {
  const status = clean(value).toLowerCase();

  if (status === "sold" || status === "sold by nego") return "продан";
  if (status === "not sold") return "не продан";
  if (status === "removed") return "снят";

  return cleanText(value) || "";
}

function mapRow(row: RawRow) {
  const images = normalizeImages(row.IMAGES || "");
  const previewImage =
    images[0]?.medium ||
    images[0]?.preview ||
    images[0]?.original ||
    "";

  return {
    id: clean(row.ID),
    lot: clean(row.LOT),
    brand: cleanText(row.MARKA_NAME),
    model: cleanText(row.MODEL_NAME),
    year: num(row.YEAR),
    body: cleanText(row.KUZOV),
    auction: cleanText(row.AUCTION),
    auctionDate: clean(row.AUCTION_DATE),
    grade: cleanText(row.GRADE),
    rate: cleanText(row.RATE),
    color: cleanText(row.COLOR),
    transmission: cleanText(row.KPP),
    drive: cleanText(row.PRIV),
    sanction: clean(row.SANCTION),
    leftHandDrive: clean(row.LHDRIVE) === "1",
    mileage: num(row.MILEAGE),
    engineVolume: num(row.ENG_V),
    startPrice: num(row.START),
    finishPrice: num(row.FINISH),
    averagePrice: num(row.AVG_PRICE),
    status: clean(row.STATUS),
    statusLabel: statusLabel(row.STATUS),
    previewImage,
    images,
  };
}

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;

    const page = toInt(p.get("page"), 1, 1, 999999);
    const limit = toInt(p.get("limit"), 24, 1, 100);
    const offset = (page - 1) * limit;
    const sort = clean(p.get("sort"));

    const where = buildWhere(p);
    const order = orderSql(sort);

    const [totalStats, total] = await Promise.all([
      safeCount("select count(*) from stats", "stats_all"),
      safeCount(`select count(*) from stats where ${where}`, `stats_${where}`),
    ]);

    const sql = order
      ? `select * from stats where ${where} order by ${order} limit ${offset},${limit}`
      : `select * from stats where ${where} limit ${offset},${limit}`;

    const rows = await safeRows(sql);
    const items = rows.map(mapRow);

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      source: "stats",
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        totalStats,
        found: total,
        shown: items.length,
      },
      items,
      debug:
        p.get("debug") === "1"
          ? {
              whereSql: `where ${where}`,
              order,
              sql,
            }
          : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
