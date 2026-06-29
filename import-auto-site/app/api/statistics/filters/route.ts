import { NextResponse } from "next/server";
import { ajesSql } from "@/lib/ajes/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

type Row = Record<string, string>;

let cache: { expires: number; payload: unknown } | null = null;

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function safeRows(sql: string) {
  try {
    return await ajesSql<Row[]>(sql);
  } catch {
    return [];
  }
}

function topOptions(rows: Row[], key: string, limit = 120) {
  const map = new Map<string, number>();

  for (const row of rows) {
    const value = clean(row[key]);

    if (!value) continue;
    if (value.length > 40) continue;
    if (/http|actual vehicle|&#|\{|\}/i.test(value)) continue;

    map.set(value, (map.get(value) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      name: value,
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"))
    .slice(0, limit);
}

export async function GET() {
  if (cache && cache.expires > Date.now()) {
    return NextResponse.json(cache.payload);
  }

  const rows = await safeRows(
    "select MARKA_NAME,MODEL_NAME,YEAR,AUCTION,COLOR,KPP,PRIV,RATE,KUZOV,STATUS from stats where AUCTION_TYPE=2 limit 0,900"
  );

  const years = Array.from({ length: 2026 - 1989 + 1 })
    .map((_, index) => String(2026 - index))
    .map((value) => ({
      value,
      label: value,
    }));

  const payload = {
    ok: true,
    source: "stats",
    filters: {
      brands: topOptions(rows, "MARKA_NAME", 160),
      years,
      auctions: topOptions(rows, "AUCTION", 40),
      colors: topOptions(rows, "COLOR", 40),
      transmissions: topOptions(rows, "KPP", 20),
      drives: topOptions(rows, "PRIV", 20),
      rates: topOptions(rows, "RATE", 20),
    },
  };

  cache = {
    expires: Date.now() + 1000 * 60 * 10,
    payload,
  };

  return NextResponse.json(payload);
}
