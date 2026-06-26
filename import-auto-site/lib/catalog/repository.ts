import { ajesSql } from "@/lib/ajes/client";
import { buildCatalogWhere, getCountValue } from "@/lib/catalog/sql";
import type { CatalogQuery } from "@/lib/catalog/filters";

export type CatalogRawRow = Record<string, string>;

export type CatalogRepositoryTiming = {
  countMs: number;
  itemsMs: number;
  totalMs: number;
};

export type CatalogRepositoryResult = {
  whereSql: string;
  countSql: string;
  itemsSql: string;
  total: number;
  rows: CatalogRawRow[];
  timing: CatalogRepositoryTiming;
};

function nowMs() {
  return Date.now();
}

export async function fetchCatalogRows(query: CatalogQuery): Promise<CatalogRepositoryResult> {
  const started = nowMs();

  const whereSql = buildCatalogWhere(query);

  const countSql = `select count(*) from main${whereSql}`;

  const itemsSql =
    `select * from main${whereSql} ` +
    `order by auction_date asc limit ${query.offset},${query.limit}`;

  const countStarted = nowMs();
  const countRows = await ajesSql<CatalogRawRow[]>(countSql);
  const countMs = nowMs() - countStarted;

  const total = getCountValue(countRows[0]);

  const itemsStarted = nowMs();
  const rows = await ajesSql<CatalogRawRow[]>(itemsSql);
  const itemsMs = nowMs() - itemsStarted;

  return {
    whereSql,
    countSql,
    itemsSql,
    total,
    rows,
    timing: {
      countMs,
      itemsMs,
      totalMs: nowMs() - started,
    },
  };
}
