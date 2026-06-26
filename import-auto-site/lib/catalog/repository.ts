import { ajesSql } from "@/lib/ajes/client";
import { buildCatalogWhere, getCountValue } from "@/lib/catalog/sql";
import type { CatalogQuery } from "@/lib/catalog/filters";

export type CatalogRawRow = Record<string, string>;

export type CatalogRepositoryResult = {
  whereSql: string;
  countSql: string;
  itemsSql: string;
  total: number;
  rows: CatalogRawRow[];
};

export async function fetchCatalogRows(query: CatalogQuery): Promise<CatalogRepositoryResult> {
  const whereSql = buildCatalogWhere(query);

  const countSql = `select count(*) from main${whereSql}`;

  const itemsSql =
    `select * from main${whereSql} ` +
    `order by auction_date asc limit ${query.offset},${query.limit}`;

  const countRows = await ajesSql<CatalogRawRow[]>(countSql);
  const total = getCountValue(countRows[0]);

  const rows = await ajesSql<CatalogRawRow[]>(itemsSql);

  return {
    whereSql,
    countSql,
    itemsSql,
    total,
    rows,
  };
}
