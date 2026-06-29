import { NextResponse } from "next/server";
import { ajesSql } from "@/lib/ajes/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

type Row = Record<string, unknown>;

let cache: { expires: number; payload: unknown } | null = null;

function num(value: unknown) {
  const raw = String(value ?? "").replace(/[^\d.-]/g, "");
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function firstValue(row: Row | undefined) {
  if (!row) return "";
  return Object.values(row)[0] ?? "";
}

async function safeRows(sql: string) {
  try {
    return await ajesSql<Row[]>(sql);
  } catch {
    return [];
  }
}

function formatDateLabel(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const match = raw.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
  }

  const date = new Date(raw.replace(" ", "T"));
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  return raw;
}

export async function GET() {
  if (cache && cache.expires > Date.now()) {
    return NextResponse.json(cache.payload);
  }

  const [countRows, dateRows] = await Promise.all([
    safeRows("select count(*) from stats where AUCTION_TYPE=2"),
    safeRows("select max(AUCTION_DATE) from stats where AUCTION_TYPE=2"),
  ]);

  const salesCount = num(firstValue(countRows[0]));
  const maxAuctionDate = firstValue(dateRows[0]);

  const payload = {
    ok: true,
    salesCount,
    salesCountLabel: new Intl.NumberFormat("ru-RU").format(salesCount),
    dataTo: String(maxAuctionDate || ""),
    dataToLabel: formatDateLabel(maxAuctionDate),
    checkedAt: new Date().toISOString(),
  };

  cache = {
    expires: Date.now() + 1000 * 60 * 10,
    payload,
  };

  return NextResponse.json(payload);
}
