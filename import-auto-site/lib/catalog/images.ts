import type { CarImage } from "@/types/car";

function clean(value: unknown): string {
  return String(value || "").trim();
}

export function stripImageSize(url: string): string {
  let value = String(url || "").trim();

  if (!value) return "";

  /*
    AJES/TRU часто отдаёт размер как хвост:
    https://7.tru.ru/imgs/TOKEN&h=50
    а не как стандартный query-параметр ?h=50.
  */
  for (let i = 0; i < 5; i++) {
    const next = value
      .replace(/([?&])(h|w)=\d+/gi, "")
      .replace(/\?&/g, "?")
      .replace(/[?&]$/g, "");

    if (next === value) break;

    value = next;
  }

  return value;
}

export function withAjesImageSize(url: string, size: "h=50" | "w=320"): string {
  const base = stripImageSize(url);

  if (!base) return "";

  /*
    Для AJES/TRU используем формат:
    https://7.tru.ru/imgs/TOKEN&w=320
  */
  return `${base}&${size}`;
}

export function normalizeCatalogImage(value: unknown): CarImage | null {
  const original = stripImageSize(clean(value));

  if (!original || !original.startsWith("http")) {
    return null;
  }

  return {
    original,
    preview: withAjesImageSize(original, "h=50"),
    medium: withAjesImageSize(original, "w=320"),
  };
}

export function normalizeCatalogImageObject(value: unknown): CarImage | null {
  if (!value) return null;

  if (typeof value === "string") {
    return normalizeCatalogImage(value);
  }

  if (typeof value !== "object") {
    return null;
  }

  const obj = value as Partial<CarImage>;

  return normalizeCatalogImage(
    obj.original ||
    obj.medium ||
    obj.preview ||
    ""
  );
}

export function uniqueImages(images: CarImage[]): CarImage[] {
  const seen = new Set<string>();
  const result: CarImage[] = [];

  for (const image of images) {
    const original = stripImageSize(
      image.original ||
      image.medium ||
      image.preview ||
      ""
    );

    if (!original || seen.has(original)) continue;

    seen.add(original);

    result.push({
      original,
      preview: withAjesImageSize(original, "h=50"),
      medium: withAjesImageSize(original, "w=320"),
    });
  }

  return result;
}

export function parseImages(images?: unknown): CarImage[] {
  if (!images) return [];

  if (Array.isArray(images)) {
    const mapped = images
      .map(normalizeCatalogImageObject)
      .filter(Boolean) as CarImage[];

    return uniqueImages(mapped);
  }

  const raw = clean(images);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return parseImages(parsed);
  } catch {
    // AJES часто отдаёт картинки строкой через #
  }

  const mapped = raw
    .split("#")
    .map((x) => x.trim())
    .filter(Boolean)
    .map(normalizeCatalogImage)
    .filter(Boolean) as CarImage[];

  return uniqueImages(mapped);
}

export function getPreviewImage(images: CarImage[]): string {
  return (
    images[0]?.preview ||
    images[0]?.medium ||
    images[0]?.original ||
    ""
  );
}

export function validateImageSet(images: CarImage[]) {
  const problems: string[] = [];

  for (const image of images) {
    if (!image.original) problems.push("missing original");
    if (!image.preview) problems.push("missing preview");
    if (!image.medium) problems.push("missing medium");

    if (/[?&][hw]=\d+/i.test(image.original)) {
      problems.push("original contains size");
    }

    if (!/[?&]h=50/i.test(image.preview)) {
      problems.push("preview is not h=50");
    }

    if (!/[?&]w=320/i.test(image.medium)) {
      problems.push("medium is not w=320");
    }

    if (
      image.preview.includes("?h=50?h=50") ||
      image.preview.includes("&h=50?h=50") ||
      image.preview.includes("&h=50?w=320") ||
      image.medium.includes("&h=50?w=320") ||
      image.medium.includes("&w=320?w=320")
    ) {
      problems.push("malformed duplicated size params");
    }
  }

  return {
    ok: problems.length === 0,
    problems,
  };
}
