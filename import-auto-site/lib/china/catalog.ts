import { ajesSql, sqlValue } from "@/lib/ajes/client";

type Row = Record<string, unknown>;

export type ChinaCatalogParams = {
  page?: number;
  limit?: number;
  brand?: string;
  model?: string;
  q?: string;
  lot?: string;
  yearFrom?: string;
  yearTo?: string;
  mileageTo?: string;
  engineFrom?: string;
  engineTo?: string;
  priceFrom?: string;
  priceTo?: string;
  body?: string;
  color?: string;
  transmission?: string;
  drive?: string;
  auction?: string;
  status?: string;
  sort?: string;
};

type ChinaFilterOption = {
  id: string;
  name: string;
  label: string;
  value: string;
  count: number;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function isAny(value: unknown) {
  const text = clean(value).toLowerCase();

  return (
    !text ||
    text === "__any__" ||
    text === "_any_" ||
    text === "any" ||
    text === "all" ||
    text === "undefined" ||
    text === "null" ||
    text === "любая" ||
    text === "любая марка" ||
    text === "любая модель" ||
    text === "все" ||
    text === "все марки" ||
    text === "все модели"
  );
}

function toInt(value: unknown, fallback = 0) {
  const n = Number(clean(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
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

function sqlLike(value: string) {
  return sqlValue(`%${value.replace(/[%_]/g, "")}%`);
}

function numberFilter(field: string, from?: string, to?: string) {
  const result: string[] = [];

  const f = toInt(from);
  const t = toInt(to);

  if (f > 0) result.push(`${field}>=${f}`);
  if (t > 0) result.push(`${field}<=${t}`);

  return result;
}

function exactFilter(field: string, value?: string) {
  if (isAny(value)) return "";
  return `${field}=${sqlValue(clean(value))}`;
}

function buildWhere(params: ChinaCatalogParams) {
  const where: string[] = [];

  if (!isAny(params.brand)) {
    where.push(`MARKA_NAME=${sqlValue(clean(params.brand))}`);
  }

  if (!isAny(params.model)) {
    where.push(`MODEL_NAME=${sqlValue(clean(params.model))}`);
  }

  const lot = clean(params.lot);
  if (lot) {
    where.push(`(LOT=${sqlValue(lot)} or ID=${sqlValue(lot)})`);
  }

  const q = clean(params.q);
  if (q) {
    where.push(
      `(MARKA_NAME like ${sqlLike(q)} or MODEL_NAME like ${sqlLike(q)} or GRADE like ${sqlLike(q)} or LOT=${sqlValue(q)} or ID=${sqlValue(q)})`
    );
  }

  where.push(...numberFilter("YEAR", params.yearFrom, params.yearTo));
  where.push(...numberFilter("MILEAGE", undefined, params.mileageTo));
  where.push(...numberFilter("ENG_V", params.engineFrom, params.engineTo));
  where.push(...numberFilter("FINISH", params.priceFrom, params.priceTo));

  [
    exactFilter("KUZOV", params.body),
    exactFilter("COLOR", params.color),
    exactFilter("KPP", params.transmission),
    exactFilter("PRIV", params.drive),
    exactFilter("AUCTION", params.auction),
    exactFilter("STATUS", params.status),
  ]
    .filter(Boolean)
    .forEach((item) => where.push(item));

  return where.length ? ` where ${where.join(" and ")}` : "";
}

function sortSql(sort?: string) {
  const key = clean(sort).toLowerCase().replace(/[-_\s]/g, "");

  switch (key) {
    case "lotasc":
      return " order by LOT asc";
    case "lotdesc":
      return " order by LOT desc";

    case "dateasc":
    case "auctiondateasc":
      return " order by AUCTION_DATE asc";
    case "datedesc":
    case "auctiondatedesc":
      return " order by AUCTION_DATE desc";

    case "yearasc":
      return " order by YEAR asc";
    case "yeardesc":
      return " order by YEAR desc";

    case "engineasc":
      return " order by ENG_V asc";
    case "enginedesc":
      return " order by ENG_V desc";

    case "mileageasc":
      return " order by MILEAGE asc";
    case "mileagedesc":
      return " order by MILEAGE desc";

    case "finishasc":
    case "priceasc":
      return " order by FINISH asc";
    case "finishdesc":
    case "pricedesc":
      return " order by FINISH desc";

    case "averageasc":
    case "avgasc":
      return " order by AVG_PRICE asc";
    case "averagedesc":
    case "avgdesc":
      return " order by AVG_PRICE desc";

    default:
      return " order by FINISH desc";
  }
}

function mapChinaRow(row: Row) {
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

async function countSql(sql: string) {
  const rows = await ajesSql<Row[]>(sql);
  const first = Array.isArray(rows) ? rows[0] : null;

  return toInt(first?.TAG0 ?? first?.["COUNT(*)"] ?? first?.count ?? first?.CNT ?? 0);
}

function normalizeOption(name: string, count: number): ChinaFilterOption | null {
  const text = clean(name);
  if (!text || text === "0" || text === "-") return null;

  return {
    id: text,
    name: text,
    label: text,
    value: text,
    count,
  };
}



const chinaFacetCache = new Map<string, { expires: number; items: ChinaFilterOption[] }>();

async function getFacet(field: string, params: ChinaCatalogParams = {}, limit = 500) {
  const safeLimit = clamp(toInt(limit, 500), 1, 1000);
  const whereSql = buildWhere(params);
  const cacheKey = JSON.stringify({ field, params, safeLimit });
  const cached = chinaFacetCache.get(cacheKey);

  if (cached && cached.expires > Date.now()) {
    return cached.items;
  }

  const sampleLimit =
    field === "MARKA_NAME"
      ? 8000
      : field === "MODEL_NAME"
        ? 8000
        : 3000;

  const queries = [
    `select * from china${whereSql} order by YEAR desc limit 0,${sampleLimit}`,
    `select * from china${whereSql} order by FINISH desc limit 0,${sampleLimit}`,
    `select * from china${whereSql} limit 0,${sampleLimit}`,
  ];

  const map = new Map<string, number>();

  for (const sql of queries) {
    try {
      const rows = await ajesSql<Row[]>(sql);

      if (!Array.isArray(rows)) continue;

      for (const row of rows) {
        const name = clean(pick(row, [field]));
        if (!name || name === "0" || name === "-") continue;

        map.set(name, (map.get(name) || 0) + 1);
      }

      if (map.size >= safeLimit) break;
    } catch {
      // Китайский источник иногда не принимает сложные SQL-агрегации.
      // Для публичных фильтров не падаем, а пробуем следующую простую выборку.
    }
  }

  const items = Array.from(map.entries())
    .map(([name, count]) => normalizeOption(name, count))
    .filter(Boolean)
    .sort((a, b) => {
      const byCount = (b?.count || 0) - (a?.count || 0);
      if (byCount) return byCount;
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    })
    .slice(0, safeLimit) as ChinaFilterOption[];

  chinaFacetCache.set(cacheKey, {
    expires: Date.now() + 5 * 60 * 1000,
    items,
  });

  return items;
}

export async function getChinaCatalog(params: ChinaCatalogParams = {}) {
  const page = clamp(toInt(params.page, 1), 1, 100000);
  const limit = clamp(toInt(params.limit, 24), 1, 100);
  const offset = (page - 1) * limit;

  const whereSql = buildWhere(params);
  const orderSql = sortSql(params.sort);

  const [total, rows] = await Promise.all([
    countSql(`select count(*) from china${whereSql}`),
    ajesSql<Row[]>(`select * from china${whereSql}${orderSql} limit ${offset},${limit}`),
  ]);

  const items = Array.isArray(rows) ? rows.map(mapChinaRow) : [];

  return {
    ok: true,
    source: "china",
    market: "china",
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    items,
    data: items,
    cars: items,
    sql: {
      where: whereSql,
      order: orderSql,
    },
  };
}

export async function getChinaBrands(limit = 500) {
  return getFacet("MARKA_NAME", {}, limit);
}

export async function getChinaModels(brand?: string, limit = 500) {
  return getFacet("MODEL_NAME", isAny(brand) ? {} : { brand }, limit);
}

export async function getChinaFacets(brand?: string, model?: string) {
  const params: ChinaCatalogParams = {};

  if (!isAny(brand)) params.brand = brand;
  if (!isAny(model)) params.model = model;

  const [brands, models, bodies, colors, transmissions, drives, auctions, statuses, grades] =
    await Promise.all([
      getFacet("MARKA_NAME", {}, 500),
      getFacet("MODEL_NAME", params.brand ? { brand: params.brand } : {}, 500),
      getFacet("KUZOV", params, 200),
      getFacet("COLOR", params, 200),
      getFacet("KPP", params, 100),
      getFacet("PRIV", params, 100),
      getFacet("AUCTION", params, 100),
      getFacet("STATUS", params, 100),
      getFacet("GRADE", params, 100),
    ]);

  return {
    ok: true,
    source: "china",
    market: "china",

    brands,
    brand: brands,
    makes: brands,
    marka: brands,
    markas: brands,

    models,
    model: models,

    bodies,
    body: bodies,
    kuzov: bodies,
    kuzovs: bodies,

    colors,
    color: colors,
    colours: colors,

    transmissions,
    transmission: transmissions,
    kpp: transmissions,
    kpps: transmissions,

    drives,
    drive: drives,
    priv: drives,

    auctions,
    auction: auctions,

    statuses,
    status: statuses,

    grades,
    grade: grades,
    rates: grades,
    rating: grades,
    ratings: grades,
    scores: grades,
  };
}

export function formatNum(value: unknown) {
  const n = toInt(value);

  if (!n) return "—";

  return new Intl.NumberFormat("ru-RU").format(n);
}

export function formatCny(value: unknown) {
  const n = toInt(value);

  if (!n) return "—";

  return `${new Intl.NumberFormat("ru-RU").format(n)} ¥`;
}

export async function getChinaLot(id: string) {
  const text = clean(id);

  if (!text) return null;

  const rows = await ajesSql<Row[]>(
    `select * from china where ID=${sqlValue(text)} or LOT=${sqlValue(text)} limit 0,1`
  );

  const first = Array.isArray(rows) ? rows[0] : null;

  return first ? mapChinaRow(first) : null;
}
