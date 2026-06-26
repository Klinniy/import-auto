import type { CatalogCar, CarImage } from "@/types/car";

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
    text.includes("&h=");

  return bad ? "" : text;
}

function stripSize(url: string): string {
  return url.replace(/([?&])[hw]=\d+$/i, "");
}

function withSize(url: string, size: "h=50" | "w=320"): string {
  const base = stripSize(url);
  return base.includes("?") ? `${base}&${size}` : `${base}?${size}`;
}

export function parseImages(images?: unknown): CarImage[] {
  if (!images) return [];

  if (Array.isArray(images)) {
    return images
      .map((item) => {
        if (typeof item === "string") {
          const original = item.trim();
          if (!original) return null;
          return {
            original,
            preview: withSize(original, "h=50"),
            medium: withSize(original, "w=320"),
          };
        }

        if (item && typeof item === "object") {
          const obj = item as Partial<CarImage>;
          const original = clean(obj.original || obj.medium || obj.preview);
          if (!original) return null;

          return {
            original,
            preview: clean(obj.preview) || withSize(original, "h=50"),
            medium: clean(obj.medium) || withSize(original, "w=320"),
          };
        }

        return null;
      })
      .filter(Boolean) as CarImage[];
  }

  const raw = clean(images);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return parseImages(parsed);
  } catch {
    // AJES часто отдаёт картинки строкой через #
  }

  return raw
    .split("#")
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((url) => url.startsWith("http"))
    .map((url) => {
      const preview = url;
      const original = stripSize(url);

      return {
        original,
        preview,
        medium: preview,
      };
    });
}

export function mapCar(row: Raw): CatalogCar {
  const images = parseImages(row.IMAGES);
  const previewImage = images[0]?.preview || images[0]?.medium || images[0]?.original || "";

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

    // Важно: сюда не должен попадать мусор из комплектаций/фото/строк AJES
    grade: cleanShort(row.GRADE, 8),

    color: clean(row.COLOR),
    transmission: clean(row.KPP),
    transmissionType: num(row.KPP_TYPE),
    drive: clean(row.PRIV),
    mileage: num(row.MILEAGE),
    engineVolume: num(row.ENG_V),
    horsePower: num(row.PW),
    equipment: clean(row.EQUIP),

    // Важно: rate показываем только если это короткая оценка
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
