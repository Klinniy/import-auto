import { unstable_cache } from "next/cache";
import { ajesSql, sqlValue } from "@/lib/ajes/client";
import { mapCar } from "@/lib/catalog/mapper";
import { getBrandsDictionary, getModelsDictionary } from "@/lib/catalog/dictionaries";
import { getCatalogResponse } from "@/lib/catalog/service";
import {
  getChinaBrands,
  getChinaCatalog,
  getChinaModels,
} from "@/lib/china/catalog";

type Row = Record<string, unknown>;

type SeoDictionaryItem = {
  id?: string;
  name: string;
  count: number;
};

export type SeoSitemapLot = {
  market: "japan" | "china";
  id: string;
  lastModified?: string;
};

export type SeoSitemapCollection = {
  market: "japan" | "china";
  brand: string;
  model?: string;
};

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function pick(row: Row, names: string[]) {
  for (const name of names) {
    const key = Object.keys(row).find((item) => item.toLowerCase() === name.toLowerCase());
    if (key) {
      const value = clean(row[key]);
      if (value) return value;
    }
  }
  return "";
}

function safeLimit(value: number, fallback: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(max, Math.trunc(n)));
}

export function seoSlug(value: unknown) {
  return clean(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveSeoItem<T extends { name: string }>(items: T[], slug: string) {
  const normalized = seoSlug(slug);
  return items.find((item) => seoSlug(item.name) === normalized) || null;
}

export async function getJapanLotServer(id: string) {
  const value = clean(decodeURIComponent(id || ""));
  if (!value) return null;

  const mainRows = await ajesSql<Row[]>(
    `select * from main where ID=${sqlValue(value)} or LOT=${sqlValue(value)} limit 0,1`
  );
  const mainRow = Array.isArray(mainRows) ? mainRows[0] : null;
  if (mainRow) return mapCar(mainRow);

  const attempts = [
    `select * from stats where auction_type=2 and ID=${sqlValue(value)} limit 0,1`,
    `select * from stats where auction_type=2 and LOT=${sqlValue(value)} limit 0,1`,
  ];

  for (const sql of attempts) {
    try {
      const rows = await ajesSql<Row[]>(sql);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) return mapCar(row);
    } catch {
      // Исторический источник может отличаться по доступным полям; пробуем следующий вариант.
    }
  }

  return null;
}

export async function getJapanSeoBrands(): Promise<SeoDictionaryItem[]> {
  const response = await getBrandsDictionary(false);
  return response.data;
}

export async function getJapanSeoModels(brand: string): Promise<SeoDictionaryItem[]> {
  const response = await getModelsDictionary(brand, false);
  return response.data;
}

export async function getJapanSeoCars(brand: string, model?: string, limit = 12) {
  const params = new URLSearchParams();
  params.set("brand", brand);
  if (model) params.set("model", model);
  params.set("page", "1");
  params.set("limit", String(safeLimit(limit, 12, 24)));
  const response = await getCatalogResponse(params);
  return { total: response.total, items: response.items };
}

export async function getChinaSeoBrands(): Promise<SeoDictionaryItem[]> {
  return getChinaBrands(500);
}

export async function getChinaSeoModels(brand: string): Promise<SeoDictionaryItem[]> {
  return getChinaModels(brand, 500);
}

export async function getChinaSeoCars(brand: string, model?: string, limit = 12) {
  const response = await getChinaCatalog({
    brand,
    ...(model ? { model } : {}),
    page: 1,
    limit: safeLimit(limit, 12, 24),
    sort: "datedesc",
  });
  return { total: response.total, items: response.items };
}

async function loadSitemapData() {
  // AJES фактически ограничивает крупные выборки примерно 500 строками.
  // Для лотов используем select *, потому что проекции ID/LOT у этого источника
  // могут возвращаться через TAG-поля и тогда формируют невалидные URL.
  const lotLimit = 500;
  const hierarchyLimit = 6000;

  const [japanLotsRaw, chinaLotsRaw, japanHierarchyRaw, chinaHierarchyRaw] = await Promise.all([
    ajesSql<Row[]>(`select * from main order by auction_date desc limit 0,${lotLimit}`),
    ajesSql<Row[]>(`select * from china order by auction_date desc limit 0,${lotLimit}`),
    ajesSql<Row[]>(`select marka_name,model_name from main order by auction_date desc limit 0,${hierarchyLimit}`),
    ajesSql<Row[]>(`select marka_name,model_name from china order by year desc limit 0,${hierarchyLimit}`),
  ]);

  const lotsByKey = new Map<string, SeoSitemapLot>();
  const collections = new Map<string, SeoSitemapCollection>();

  for (const [market, rows] of [
    ["japan", japanLotsRaw],
    ["china", chinaLotsRaw],
  ] as const) {
    for (const row of Array.isArray(rows) ? rows : []) {
      const id = pick(row, ["ID", "id"]) || pick(row, ["LOT", "lot"]);
      if (!id) continue;

      const lastModified = pick(row, ["AUCTION_DATE", "auction_date"]);
      const key = `${market}|${id}`;

      if (!lotsByKey.has(key)) {
        lotsByKey.set(key, {
          market,
          id,
          ...(lastModified ? { lastModified } : {}),
        });
      }
    }
  }

  for (const [market, rows] of [
    ["japan", japanHierarchyRaw],
    ["china", chinaHierarchyRaw],
  ] as const) {
    for (const row of Array.isArray(rows) ? rows : []) {
      const brand = pick(row, ["MARKA_NAME", "marka_name"]);
      const model = pick(row, ["MODEL_NAME", "model_name"]);
      if (!brand) continue;

      const brandKey = `${market}|${seoSlug(brand)}`;
      if (!collections.has(brandKey)) {
        collections.set(brandKey, { market, brand });
      }

      if (model) {
        const modelKey = `${market}|${seoSlug(brand)}|${seoSlug(model)}`;
        if (!collections.has(modelKey)) {
          collections.set(modelKey, { market, brand, model });
        }
      }
    }
  }

  return {
    lots: Array.from(lotsByKey.values()),
    collections: Array.from(collections.values()),
  };
}

export const getSeoSitemapData = unstable_cache(loadSitemapData, ["mosaicauto-seo-sitemap-v2"], {
  revalidate: 60 * 60,
});
