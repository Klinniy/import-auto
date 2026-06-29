import { NextRequest, NextResponse } from "next/server";
import { ajesSql, sqlValue } from "@/lib/ajes/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, string>;

const STATS_WHERE = "AUCTION_TYPE=2";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function num(value: unknown) {
  const raw = String(value ?? "").replace(/[^\d.-]/g, "");
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

async function safeRows(sql: string) {
  try {
    return await ajesSql<Row[]>(sql);
  } catch {
    return [];
  }
}

function mapFacet(rows: Row[], key: string) {
  return rows
    .map((row) => ({
      key: clean(row[key]),
      count: num(row.CNT ?? row.cnt ?? row.TAG1 ?? row.TAG0 ?? Object.values(row)[1]),
    }))
    .filter((item) => item.key)
    .slice(0, 80);
}

function fallback(values: string[]) {
  return values.map((key) => ({
    key,
    count: 0,
  }));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const brand = clean(url.searchParams.get("brand"));

  const modelWhere =
    brand && brand !== "__any__"
      ? `${STATS_WHERE} AND MARKA_NAME=${sqlValue(brand)}`
      : STATS_WHERE;

  const [
    brandRows,
    modelRows,
    bodyRows,
    rateRows,
    auctionRows,
    colorRows,
    statusRows,
    kppRows,
  ] = await Promise.all([
    safeRows(`select MARKA_NAME, count(*) CNT from stats where ${STATS_WHERE} group by MARKA_NAME order by CNT desc limit 120`),
    brand && brand !== "__any__"
      ? safeRows(`select MODEL_NAME, count(*) CNT from stats where ${modelWhere} group by MODEL_NAME order by CNT desc limit 160`)
      : Promise.resolve([]),
    safeRows(`select KUZOV, count(*) CNT from stats where ${STATS_WHERE} and KUZOV<>'' group by KUZOV order by CNT desc limit 24`),
    safeRows(`select RATE, count(*) CNT from stats where ${STATS_WHERE} and RATE<>'' group by RATE order by CNT desc limit 16`),
    safeRows(`select AUCTION, count(*) CNT from stats where ${STATS_WHERE} and AUCTION<>'' group by AUCTION order by CNT desc limit 28`),
    safeRows(`select COLOR, count(*) CNT from stats where ${STATS_WHERE} and COLOR<>'' group by COLOR order by CNT desc limit 24`),
    safeRows(`select STATUS, count(*) CNT from stats where ${STATS_WHERE} and STATUS<>'' group by STATUS order by CNT desc limit 12`),
    safeRows(`select KPP, count(*) CNT from stats where ${STATS_WHERE} and KPP<>'' group by KPP order by CNT desc limit 12`),
  ]);

  return NextResponse.json({
    ok: true,
    source: "stats: AUCTION_TYPE=2",
    brands: mapFacet(brandRows, "MARKA_NAME"),
    models: mapFacet(modelRows, "MODEL_NAME"),
    bodies: mapFacet(bodyRows, "KUZOV").length ? mapFacet(bodyRows, "KUZOV") : fallback(["NH", "ZVW", "NCP", "M900A", "L375S", "E12"]),
    rates: mapFacet(rateRows, "RATE").length ? mapFacet(rateRows, "RATE") : fallback(["3.5", "4", "R"]),
    auctions: mapFacet(auctionRows, "AUCTION").length ? mapFacet(auctionRows, "AUCTION") : fallback(["AUCNET", "USS Yokohama", "TAA Kinki", "JU Tokyo"]),
    colors: mapFacet(colorRows, "COLOR").length ? mapFacet(colorRows, "COLOR") : fallback(["white", "black", "silver", "pearl", "blue"]),
    statuses: mapFacet(statusRows, "STATUS").length ? mapFacet(statusRows, "STATUS") : fallback(["SOLD", "not sold"]),
    kpps: mapFacet(kppRows, "KPP").length ? mapFacet(kppRows, "KPP") : fallback(["FA", "AT", "IAT", "CVT", "MT"]),
  });
}
