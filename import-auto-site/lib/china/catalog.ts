import { ajesSql, sqlValue } from "@/lib/ajes/client";

type Row = Record<string, unknown>;

export type ChinaCatalogParams = {
  page?: number;
  limit?: number;
  brand?: string;
  model?: string;
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
  sort?: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
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

  if (base.includes("/imgs/")) {
    return {
      original: base,
      preview: `${base}&h=80`,
      medium: `${base}&w=320`,
    };
  }

  return {
    original: base,
    preview: base,
    medium: base,
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

function numberFilter(field: string, from?: string, to?: string) {
  const result: string[] = [];

  const f = toInt(from);
  const t = toInt(to);

  if (f > 0) result.push(`${field}>=${f}`);
  if (t > 0) result.push(`${field}<=${t}`);

  return result;
}

function exactFilter(field: string, value?: string) {
  const text = clean(value);
  if (!text || text === "__any__") return "";
  return `${field}=${sqlValue(text)}`;
}

function buildWhere(params: ChinaCatalogParams) {
  const where: string[] = [];

  const brand = clean(params.brand);
  const model = clean(params.model);
  const lot = clean(params.lot);

  if (brand && brand !== "__any__") where.push(`MARKA_NAME=${sqlValue(brand)}`);
  if (model && model !== "__any__") where.push(`MODEL_NAME=${sqlValue(model)}`);

  if (lot) {
    where.push(`(LOT=${sqlValue(lot)} or ID=${sqlValue(lot)})`);
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
  ]
    .filter(Boolean)
    .forEach((item) => where.push(item));

  return where.length ? ` where ${where.join(" and ")}` : "";
}

function sortSql(sort?: string) {
  switch (clean(sort)) {
    case "priceAsc":
      return " order by FINISH asc";
    case "priceDesc":
      return " order by FINISH desc";
    case "yearAsc":
      return " order by YEAR asc";
    case "yearDesc":
      return " order by YEAR desc";
    case "mileageAsc":
      return " order by MILEAGE asc";
    case "mileageDesc":
      return " order by MILEAGE desc";
    case "engineAsc":
      return " order by ENG_V asc";
    case "engineDesc":
      return " order by ENG_V desc";
    case "lotAsc":
      return " order by LOT asc";
    case "lotDesc":
      return " order by LOT desc";
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

  const startPrice = toInt(pick(row, ["START", "start"]));
  const finishPrice = toInt(pick(row, ["FINISH", "finish"]));
  const priceCny = finishPrice || startPrice;

  return {
    id,
    source: "china",
    market: "china",

    lot,
    brand,
    make: brand,
    marka: brand,
    model,
    modelName: model,

    year: toInt(pick(row, ["YEAR", "year"])),
    engineVolume: toInt(pick(row, ["ENG_V", "engineVolume", "volume"])),
    power: clean(pick(row, ["PW", "power"])),
    body: clean(pick(row, ["KUZOV", "body"])),
    grade: decodeHtml(pick(row, ["GRADE", "grade"])),
    color: clean(pick(row, ["COLOR", "color"])),
    transmission: clean(pick(row, ["KPP", "transmission"])),
    transmissionType: clean(pick(row, ["KPP_TYPE", "transmissionType"])),
    drive: clean(pick(row, ["PRIV", "drive"])),
    mileage: toInt(pick(row, ["MILEAGE", "mileage"])),

    startPrice,
    finishPrice,
    priceCny,
    avgPrice: toInt(pick(row, ["AVG_PRICE", "avgPrice"])),
    status: clean(pick(row, ["STATUS", "status"])),
    time: clean(pick(row, ["TIME", "time"])),

    auctionDate: clean(pick(row, ["AUCTION_DATE", "auctionDate"])),
    auction: clean(pick(row, ["AUCTION", "auction"])) || "Китай",

    images,
    photos: images,
    previewImage: firstImage?.medium || firstImage?.preview || "",
    image: firstImage?.medium || firstImage?.preview || "",

    raw: row,
  };
}

async function countSql(sql: string) {
  const rows = await ajesSql<Row[]>(sql);
  const first = Array.isArray(rows) ? rows[0] : null;

  return toInt(first?.TAG0 ?? first?.["COUNT(*)"] ?? first?.count ?? first?.CNT ?? 0);
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
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    items,
    sql: {
      where: whereSql,
      order: orderSql,
    },
  };
}

async function getFacet(field: string, whereSql = "", limit = 12) {
  try {
    const rows = await ajesSql<Row[]>(
      `select ${field}, count(*) CNT from china${whereSql} group by ${field} order by CNT desc limit 0,${clamp(limit, 1, 200)}`
    );

    return Array.isArray(rows)
      ? rows
          .map((row) => ({
            name: clean(row[field] ?? pick(row, [field])),
            count: toInt(row.CNT ?? row.TAG0),
          }))
          .filter((item) => item.name && item.name !== "0" && item.name !== "-")
      : [];
  } catch {
    return [];
  }
}

// ===== China catalog filter helpers: generated safe fallback =====
// Фильтры Китая строятся из тех же нормализованных items, которые уже возвращает getChinaCatalog.
// Это временно надежнее, чем отдельные пустые DISTINCT-запросы, пока структура china окончательно не закреплена.

type ChinaFilterOption = {
  id: string;
  name: string;
  label: string;
  value: string;
  count: number;
};

function __chinaFilterRead(obj: any, path: string): any {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((acc: any, key: string) => acc == null ? undefined : acc[key], obj);
}

function __chinaFilterText(value: any): string {
  return String(value ?? "").trim();
}

function __chinaFilterKey(value: any): string {
  return __chinaFilterText(value).toUpperCase();
}

function __chinaFilterPick(item: any, paths: string[]): string {
  for (const path of paths) {
    const value = __chinaFilterText(__chinaFilterRead(item, path));
    if (value) return value;
  }
  return "";
}

function __chinaFilterArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;

  for (const key of ["items", "data", "cars", "lots", "rows", "result", "results"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
}

function __chinaFilterOptions(items: any[], paths: string[], limit = 500): ChinaFilterOption[] {
  const map = new Map<string, { name: string; count: number }>();

  for (const item of items) {
    const name = __chinaFilterPick(item, paths);
    if (!name) continue;

    const key = __chinaFilterKey(name);
    if (!key) continue;

    const current = map.get(key);
    if (current) {
      current.count += 1;
    } else {
      map.set(key, { name, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([key, item]) => ({
      id: key,
      name: item.name,
      label: item.name,
      value: item.name,
      count: item.count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, Math.max(1, Number(limit) || 500));
}

function __chinaFilterSameBrand(item: any, brand?: string): boolean {
  const expected = __chinaFilterKey(brand);
  if (!expected) return true;

  const actual = __chinaFilterKey(
    __chinaFilterPick(item, [
      "brand",
      "make",
      "marka",
      "raw.MARKA_NAME",
      "MARKA_NAME",
    ])
  );

  return actual === expected;
}

async function __chinaFilterItems(params: any = {}, sampleLimit = 8000): Promise<any[]> {
  const limit = Math.min(Math.max(Number(sampleLimit) || 8000, 500), 15000);

  const payload = await getChinaCatalog({
    ...(params || {}),
    page: 1,
    limit,
  } as any);

  return __chinaFilterArray(payload);
}
// ===== /China catalog filter helpers =====

export async function getChinaBrands(limit = 500) {
  const items = await __chinaFilterItems({}, 12000);

  return __chinaFilterOptions(
    items,
    [
      "brand",
      "make",
      "marka",
      "raw.MARKA_NAME",
      "MARKA_NAME",
    ],
    limit
  );
}

export async function getChinaModels(brand?: string, limit = 500) {
  const items = await __chinaFilterItems(
    {
      brand: brand || undefined,
      marka: brand || undefined,
    },
    12000
  );

  const filtered = items.filter((item) => __chinaFilterSameBrand(item, brand));

  return __chinaFilterOptions(
    filtered,
    [
      "model",
      "modelName",
      "raw.MODEL_NAME",
      "MODEL_NAME",
    ],
    limit
  );
}

export async function getChinaFacets(brand?: string) {
  const items = await __chinaFilterItems(
    {
      brand: brand || undefined,
      marka: brand || undefined,
    },
    12000
  );

  const filtered = items.filter((item) => __chinaFilterSameBrand(item, brand));

  const bodies = __chinaFilterOptions(
    filtered,
    [
      "body",
      "raw.KUZOV",
      "KUZOV",
    ],
    500
  );

  const colors = __chinaFilterOptions(
    filtered,
    [
      "color",
      "raw.COLOR",
      "COLOR",
    ],
    500
  );

  const transmissions = __chinaFilterOptions(
    filtered,
    [
      "transmission",
      "raw.KPP",
      "KPP",
    ],
    100
  );

  const drives = __chinaFilterOptions(
    filtered,
    [
      "drive",
      "raw.PRIV",
      "PRIV",
    ],
    100
  );

  const grades = __chinaFilterOptions(
    filtered,
    [
      "grade",
      "raw.GRADE",
      "GRADE",
      "raw.RATE",
      "RATE",
    ],
    500
  );

  const auctions = __chinaFilterOptions(
    filtered,
    [
      "auction",
      "raw.AUCTION",
      "AUCTION",
    ],
    100
  );

  const statuses = __chinaFilterOptions(
    filtered,
    [
      "status",
      "raw.STATUS",
      "STATUS",
    ],
    100
  );

  return {
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

    grades,
    grade: grades,
    rates: grades,
    rating: grades,
    ratings: grades,
    scores: grades,

    auctions,
    auction: auctions,

    statuses,
    status: statuses,
  };
}

export async function getChinaLot(rawId: string) {
  const id = decodeURIComponent(clean(rawId));
  if (!id) return null;

  const rows = await ajesSql<Row[]>(
    `select * from china where ID=${sqlValue(id)} or LOT=${sqlValue(id)} limit 0,1`
  );

  const row = Array.isArray(rows) ? rows[0] : null;
  return row ? mapChinaRow(row) : null;
}

export function formatCny(value: unknown) {
  const n = toInt(value);
  if (!n) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(n)} CNY`;
}

export function formatNum(value: unknown, suffix = "") {
  const n = toInt(value);
  if (!n) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(n)}${suffix}`;
}
