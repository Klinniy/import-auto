import { NextRequest, NextResponse } from "next/server";
import { ajesSql, sqlValue } from "@/lib/ajes/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

type Row = Record<string, string>;

const cache = new Map<string, { expires: number; payload: unknown }>();

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

function options(rows: Row[]) {
  const map = new Map<string, number>();

  for (const row of rows) {
    const value = clean(row.MODEL_NAME);

    if (!value) continue;
    if (value.length > 48) continue;
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
    .slice(0, 220);
}

export async function GET(req: NextRequest) {
  const brand = clean(req.nextUrl.searchParams.get("brand"));

  if (!brand || brand === "__any__") {
    return NextResponse.json({
      ok: true,
      items: [],
      data: [],
    });
  }

  const cached = cache.get(brand);

  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.payload);
  }

  const rows = await safeRows(
    `select MODEL_NAME from stats where AUCTION_TYPE=2 and MARKA_NAME=${sqlValue(brand)} limit 0,1200`
  );

  const items = options(rows);

  const payload = {
    ok: true,
    items,
    data: items,
  };

  cache.set(brand, {
    expires: Date.now() + 1000 * 60 * 10,
    payload,
  });

  return NextResponse.json(payload);
}
