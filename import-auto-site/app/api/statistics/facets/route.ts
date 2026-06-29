import { NextRequest, NextResponse } from "next/server";
import { ajesSql, sqlValue, toInt } from "@/lib/ajes/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 120;

type Row = Record<string, string>;

const STATS_WHERE = "AUCTION_TYPE=2";

const cache = new Map<string, { expires: number; payload: unknown }>();

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function like(value: string) {
  return sqlValue(`%${value}%`);
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

function normalizeStatusValue(value: string) {
  const v = clean(value).toLowerCase();

  if (v === "sold" || v === "продан") return "SOLD";
  if (v === "not_sold" || v === "not sold" || v === "не продан") return "not sold";
  if (v === "removed" || v === "снят") return "removed";

  return value;
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

  return where.join(" and ");
}

async function safeRows(sql: string) {
  try {
    return await ajesSql<Row[]>(sql);
  } catch {
    return [];
  }
}

function topFacet(rows: Row[], key: string, limit = 8) {
  const map = new Map<string, number>();

  for (const row of rows) {
    const value = clean(row[key]);

    if (!value) continue;
    if (value.length > 42) continue;
    if (/http|actual vehicle|&#|\{|\}/i.test(value)) continue;

    map.set(value, (map.get(value) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
      sampleImage: "",
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function GET(req: NextRequest) {
  const where = buildWhere(req.nextUrl.searchParams);
  const key = where;

  const cached = cache.get(key);

  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.payload);
  }

  const rows = await safeRows(
    `select KUZOV,RATE,AUCTION,COLOR,STATUS,KPP,PRIV from stats where ${where} limit 0,600`
  );

  const payload = {
    ok: true,
    source: "stats",
    facets: {
      bodies: topFacet(rows, "KUZOV", 12),
      rates: topFacet(rows, "RATE", 10),
      auctions: topFacet(rows, "AUCTION", 14),
      colors: topFacet(rows, "COLOR", 12),
      statuses: topFacet(rows, "STATUS", 8),
      transmissions: topFacet(rows, "KPP", 8),
      drives: topFacet(rows, "PRIV", 8),
    },
  };

  cache.set(key, {
    expires: Date.now() + 1000 * 60 * 5,
    payload,
  });

  return NextResponse.json(payload);
}
