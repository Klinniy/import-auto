import type { CatalogCar } from "@/types/car";
import { getPreviewImage, parseImages } from "@/lib/catalog/images";

export { parseImages } from "@/lib/catalog/images";

type Raw = Record<string, unknown>;

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function bool01(value: unknown): boolean {
  return String(value || "") === "1";
}

function clean(value: unknown): string {
  return String(value || "").trim();
}

function cleanShort(value: unknown, max = 12): string {
  const text = clean(value);

  if (!text || text === "-") return "";

  const bad =
    text.length > max ||
    text.includes("http") ||
    text.includes("{") ||
    text.includes("[") ||
    text.includes("High ") ||
    text.includes("Low ") ||
    text.includes("Seat ") ||
    text.includes("Package") ||
    text.includes("#") ||
    text.includes("&w=") ||
    text.includes("&h=") ||
    text.includes("?w=") ||
    text.includes("?h=");

  return bad ? "" : text;
}

export function mapCar(row: Raw): CatalogCar {
  const images = parseImages(row.IMAGES);
  const previewImage = getPreviewImage(images);

  return {
    id: clean(row.ID),
    lot: clean(row.LOT),
    brand: clean(row.MARKA_NAME),
    model: clean(row.MODEL_NAME),
    year: num(row.YEAR),
    body: clean(row.KUZOV),
    auctionType: num(row.AUCTION_TYPE),
    auction: clean(row.AUCTION),
    auctionDate: clean(row.AUCTION_DATE),

    grade: cleanShort(row.GRADE, 8),

    color: clean(row.COLOR),
    transmission: clean(row.KPP),
    transmissionType: num(row.KPP_TYPE),
    drive: clean(row.PRIV),
    mileage: num(row.MILEAGE),
    engineVolume: num(row.ENG_V),
    horsePower: num(row.PW),
    equipment: clean(row.EQUIP),

    rate: cleanShort(row.RATE, 8),

    startPrice: num(row.START),
    finishPrice: num(row.FINISH),
    averagePrice: num(row.AVG_PRICE),
    averageString: clean(row.AVG_STRING),
    status: clean(row.STATUS),
    time: clean(row.TIME),
    sanction: bool01(row.SANCTION),
    leftHandDrive: bool01(row.LHDRIVE),
    previewImage,
    imagesCount: images.length,
    images,
    info: clean(row.INFO),
    serial: clean(row.SERIAL),
  };
}
