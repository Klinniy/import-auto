// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { ajesSql, sqlValue } from "@/lib/ajes/client";
import { mapCar } from "@/lib/catalog/mapper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function toInt(value: unknown) {
  const n = Number(clean(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function pick(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const found = Object.keys(row).find(
      (item) => item.toLowerCase() === key.toLowerCase()
    );

    if (found) return row[found];
  }

  return "";
}


function imageValue(item: any) {
  if (!item) return "";

  if (typeof item === "string") {
    return clean(item);
  }

  return (
    clean(item.medium) ||
    clean(item.preview) ||
    clean(item.original) ||
    clean(item.url) ||
    clean(item.src)
  );
}


function statsAuctionSheetUrl(item: any) {
  const raw =
    (item && typeof item === "object"
      ? clean(item.original) || clean(item.url) || clean(item.src) || clean(item.preview) || clean(item.medium)
      : clean(item)) || "";

  if (!raw) return "";

  if (raw.includes("7.tru.ru/imgs/")) {
    const base = raw.split("&")[0].split("?")[0];
    return `${base}&w=320`;
  }

  return raw;
}

function splitImages(value: unknown) {
  const raw = clean(value);
  if (!raw) return [];

  return raw
    .split(/[#,\s]+/)
    .map((url) => clean(url))
    .filter((url) => /^https?:\/\//i.test(url))
    .map((url) => {
      const base = url.replace(/&h=\d+/g, "").replace(/&w=\d+/g, "");

      return {
        original: base,
        preview: base.includes("/imgs/") ? `${base}&h=80` : base,
        medium: base.includes("/imgs/") ? `${base}&w=640` : base,
        small: base.includes("/imgs/") ? `${base}&h=80` : base,
        thumb: base.includes("/imgs/") ? `${base}&h=80` : base,
        url: base,
        src: base,
      };
    });
}

function mapStatsCar(row: Record<string, any>) {
  const rawImages = splitImages(
    pick(row, [
      "IMAGES",
      "images",
      "PHOTO",
      "photo",
      "PHOTOS",
      "photos",
      "PICTURES",
      "pictures",
    ])
  );

  const auctionSheetImage = statsAuctionSheetUrl(rawImages[0]);

  const images =
    rawImages.length > 1
      ? rawImages.slice(1)
      : rawImages;

  const id = clean(pick(row, ["ID", "id"])) || clean(pick(row, ["LOT", "lot"]));
  const lot = clean(pick(row, ["LOT", "lot"])) || id;

  const brand = clean(pick(row, ["MARKA_NAME", "marka_name", "brand", "make"]));
  const model = clean(pick(row, ["MODEL_NAME", "model_name", "model"]));

  const year = toInt(pick(row, ["YEAR", "year"]));
  const body = clean(pick(row, ["KUZOV", "kuzov", "body"]));
  const color = clean(pick(row, ["COLOR", "color"]));

  const engineVolume = toInt(pick(row, ["ENG_V", "eng_v", "engine", "volume"]));
  const mileage = toInt(pick(row, ["MILEAGE", "mileage"]));

  const grade = clean(pick(row, ["RATE", "rate", "GRADE", "grade", "EVALUATION", "evaluation"]));
  const transmission = clean(pick(row, ["KPP", "kpp", "transmission"]));
  const drive = clean(pick(row, ["PRIV", "priv", "drive"]));

  const auction = clean(pick(row, ["AUCTION", "auction"]));
  const auctionDate = clean(pick(row, ["AUCTION_DATE", "auction_date", "date"]));

  const startPrice = toInt(pick(row, ["START", "start"]));
  const finishPrice = toInt(pick(row, ["FINISH", "finish"]));
  const averagePrice = toInt(pick(row, ["AVG_PRICE", "avg_price", "averagePrice", "avgPrice"]));

  const status = clean(pick(row, ["STATUS", "status"]));

  const previewImage =
    clean(images?.[0]?.medium) ||
    clean(images?.[0]?.preview) ||
    clean(images?.[0]?.original);

  return {
    id,
    source: "statistics",
    market: "statistics",

    lot,
    lotNo: lot,
    lotNumber: lot,
    number: lot,

    brand,
    make: brand,
    marka: brand,

    model,
    modelName: model,

    year,
    body,
    kuzov: body,
    color,

    engineVolume,
    engine: engineVolume,
    volume: engineVolume,

    mileage,
    mileageKm: mileage,

    grade,
    rate: grade,
    score: grade,
    evaluation: grade,

    transmission,
    kpp: transmission,
    drive,
    priv: drive,

    auction,
    auctionDate,

    startPrice,
    finishPrice,
    soldPrice: finishPrice,
    averagePrice,
    avgPrice: averagePrice,
    currentPrice: averagePrice,
    bidPrice: averagePrice,
    price: averagePrice || finishPrice || startPrice,

    status,
    statusLabel:
      status === "removed"
        ? "снят"
        : status === "cancelled"
          ? "отменен"
          : status || "—",

    images,
    photos: images,
    previewImage,
    image: previewImage,
    img: previewImage,

    auctionSheet: auctionSheetImage,
    auctionSheetImage,
    auctionSheetUrl: auctionSheetImage,
    sheet: auctionSheetImage,
    sheetImage: auctionSheetImage,
    schemeImage: auctionSheetImage,

    raw: row,
  };
}

async function getMainCar(id: string) {
  const rows = await ajesSql<any[]>(
    `select * from main where id=${sqlValue(id)} limit 0,1`
  );

  const row = Array.isArray(rows) ? rows[0] : null;

  return row ? mapCar(row) : null;
}

async function getStatsCar(id: string) {
  const value = clean(decodeURIComponent(id));

  const attempts = [
    `select * from stats where auction_type=2 and ID=${sqlValue(value)} limit 0,1`,
    `select * from stats where auction_type=2 and id=${sqlValue(value)} limit 0,1`,
    `select * from stats where auction_type=2 and LOT=${sqlValue(value)} limit 0,1`,
    `select * from stats where auction_type=2 and lot=${sqlValue(value)} limit 0,1`,
  ];

  for (const sql of attempts) {
    try {
      const rows = await ajesSql<any[]>(sql);
      const row = Array.isArray(rows) ? rows[0] : null;

      if (row) return mapStatsCar(row);
    } catch {}
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const source = request.nextUrl.searchParams.get("source") || "";
  const sourceNormalized = String(source || "").toLowerCase();
  const isStatsSource = ["stats", "stat", "statistics"].includes(sourceNormalized);

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "id is required" },
        { status: 400 }
      );
    }

    const car =
      isStatsSource
        ? await getStatsCar(id)
        : await getMainCar(id);

    if (!car) {
      return NextResponse.json(
        {
          ok: false,
          id,
          source,
          error: "car not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      id,
      source: source || "catalog",
      data: car,
      car,
      item: car,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
