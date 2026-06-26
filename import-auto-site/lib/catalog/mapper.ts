import type { CatalogCar, CarImage } from "@/types/car";

type Raw = Record<string, string | undefined>;

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

export function parseImages(images?: string): CarImage[] {
  return String(images || "")
    .split("#")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((url) => {
      const base = url.replace(/&[hw]=\d+$/i, "");
      return {
        original: base,
        preview: base + "&h=50",
        medium: base + "&w=320"
      };
    });
}

export function mapCar(row: Raw): CatalogCar {
  const images = parseImages(row.IMAGES);
  const previewImage = images[0]?.medium || images[0]?.preview || "";

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
    grade: clean(row.GRADE),
    color: clean(row.COLOR),
    transmission: clean(row.KPP),
    transmissionType: num(row.KPP_TYPE),
    drive: clean(row.PRIV),
    mileage: num(row.MILEAGE),
    engineVolume: num(row.ENG_V),
    horsePower: num(row.PW),
    equipment: clean(row.EQUIP),
    rate: clean(row.RATE),
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
    serial: clean(row.SERIAL)
  };
}
