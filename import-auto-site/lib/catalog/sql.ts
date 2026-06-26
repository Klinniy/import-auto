import { sqlLike, sqlValue, toInt } from "@/lib/ajes/client";

export type CatalogFilters = {
  brand?: string;
  model?: string;
  q?: string;
  yearFrom?: string;
  yearTo?: string;
  priceFrom?: string;
  priceTo?: string;
  mileageTo?: string;
  rateFrom?: string;
  auction?: string;
};

export function buildCatalogWhere(filters: CatalogFilters) {
  const where: string[] = [];

  if (filters.brand) where.push(`marka_name=${sqlValue(filters.brand)}`);
  if (filters.model) where.push(`model_name=${sqlValue(filters.model)}`);

  if (filters.q) {
    where.push(
      `(marka_name like ${sqlLike(filters.q)} or model_name like ${sqlLike(filters.q)} or kuzov like ${sqlLike(filters.q)} or lot like ${sqlLike(filters.q)})`
    );
  }

  if (filters.yearFrom) where.push(`year>=${toInt(filters.yearFrom, 1900, 1900, 2100)}`);
  if (filters.yearTo) where.push(`year<=${toInt(filters.yearTo, 2100, 1900, 2100)}`);
  if (filters.priceFrom) where.push(`avg_price>=${toInt(filters.priceFrom, 0, 0, 999999999)}`);
  if (filters.priceTo) where.push(`avg_price<=${toInt(filters.priceTo, 999999999, 0, 999999999)}`);
  if (filters.mileageTo) where.push(`mileage<=${toInt(filters.mileageTo, 999999999, 0, 999999999)}`);
  if (filters.rateFrom) where.push(`rate>=${sqlValue(filters.rateFrom)}`);
  if (filters.auction) where.push(`auction=${sqlValue(filters.auction)}`);

  return where.length ? " where " + where.join(" and ") : "";
}

export function getCountValue(row: Record<string, string> | undefined) {
  if (!row) return 0;
  return Number(row.TAG0 || row["COUNT(*)"] || row["count(*)"] || 0);
}
