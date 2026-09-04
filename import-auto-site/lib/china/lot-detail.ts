import { ajesSql, sqlValue } from "@/lib/ajes/client";

type Row = Record<string, unknown>;

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function toInt(value: unknown, fallback = 0) {
  const n = Number(clean(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function pick(row: Row, keys: string[]) {
  for (const key of keys) {
    const found = Object.keys(row).find(
      (item) => item.toLowerCase() === key.toLowerCase()
    );

    if (found) return row[found];
  }

  return "";
}

function decodeHtml(value: unknown) {
  return clean(value).replace(/&#(\d+);/g, (_m, code) => {
    const n = Number(code);
    return Number.isFinite(n) ? String.fromCharCode(n) : "";
  });
}

function stripSize(url: string) {
  return clean(url).replace(/&h=\d+/g, "").replace(/&w=\d+/g, "");
}

function imageObject(url: string) {
  const base = stripSize(url);
  if (!base) return null;

  const separator = base.includes("?") ? "&" : "?";

  return {
    original: base,
    preview: `${base}${separator}h=80`,
    medium: `${base}${separator}w=320`,
  };
}

function parseImages(value: unknown) {
  const raw = clean(value);
  if (!raw) return [];

  const result: Array<{ original: string; preview: string; medium: string }> = [];

  raw
    .split("#")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((url) => {
      const image = imageObject(url);

      if (image && !result.some((item) => item.original === image.original)) {
        result.push(image);
      }
    });

  return result;
}

function mapChinaLotRow(row: Row) {
  const images = parseImages(pick(row, ["IMAGES", "images", "photo", "photos"]));
  const firstImage = images[0];

  const brand = clean(pick(row, ["MARKA_NAME", "brand", "marka", "make"]));
  const model = clean(pick(row, ["MODEL_NAME", "model", "modelName"]));
  const lot = clean(pick(row, ["LOT", "lot"]));
  const id = clean(pick(row, ["ID", "id"])) || lot;

  const startPrice = toInt(pick(row, ["START", "start", "startPrice"]));
  const finishPrice = toInt(pick(row, ["FINISH", "finish", "finishPrice", "price"]));
  const averagePrice = toInt(pick(row, ["AVG_PRICE", "avgPrice", "averagePrice"]));
  const priceCny = finishPrice || startPrice || averagePrice;
  const previewImage = firstImage?.medium || firstImage?.preview || "";

  return {
    id,
    source: "china",
    market: "china",
    country: "Китай",
    lot,
    brand,
    make: brand,
    marka: brand,
    model,
    modelName: model,
    title: [brand, model].filter(Boolean).join(" "),
    year: toInt(pick(row, ["YEAR", "year"])),
    engineVolume: toInt(pick(row, ["ENG_V", "engineVolume", "volume"])),
    power: clean(pick(row, ["PW", "power"])),
    body: clean(pick(row, ["KUZOV", "body"])),
    grade: decodeHtml(pick(row, ["GRADE", "grade"])),
    rate: decodeHtml(pick(row, ["RATE", "RAT", "rating", "score"])),
    color: clean(pick(row, ["COLOR", "color"])),
    transmission: clean(pick(row, ["KPP", "transmission"])),
    transmissionType: clean(pick(row, ["KPP_TYPE", "transmissionType"])),
    drive: clean(pick(row, ["PRIV", "drive"])),
    mileage: toInt(pick(row, ["MILEAGE", "mileage"])),
    startPrice,
    finishPrice,
    averagePrice,
    avgPrice: averagePrice,
    currentPrice: finishPrice,
    price: priceCny,
    foreignPrice: priceCny,
    priceCny,
    currency: "CNY",
    priceCurrency: "CNY",
    status: clean(pick(row, ["STATUS", "status"])),
    time: clean(pick(row, ["TIME", "time"])),
    auctionDate: clean(pick(row, ["AUCTION_DATE", "auctionDate"])),
    auction: clean(pick(row, ["AUCTION", "auction"])) || "Китай",
    images,
    photos: images,
    previewImage,
    image: previewImage,
    raw: row,
  };
}

export async function getChinaLotExact(idOrLot: string) {
  const value = clean(decodeURIComponent(idOrLot || ""));
  if (!value) return null;

  // Public China catalog URLs use LOT first. Query exact fields separately because
  // the AJES SQL parser is unreliable with OR in detail lookups.
  for (const sql of [
    `select * from china where LOT=${sqlValue(value)} limit 0,1`,
    `select * from china where ID=${sqlValue(value)} limit 0,1`,
  ]) {
    try {
      const rows = await ajesSql<Row[]>(sql);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) return mapChinaLotRow(row);
    } catch {
      // Try the next exact lookup.
    }
  }

  return null;
}
