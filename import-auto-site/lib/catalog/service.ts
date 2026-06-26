import { parseCatalogQuery } from "@/lib/catalog/filters";
import { fetchCatalogRows } from "@/lib/catalog/repository";
import { mapCar } from "@/lib/catalog/mapper";

export type CatalogServiceResponse = {
  ok: true;
  page: number;
  limit: number;
  total: number;
  pages: number;
  items: ReturnType<typeof mapCar>[];
  debug?: {
    whereSql: string;
    countSql: string;
    itemsSql: string;
  };
};

export async function getCatalogResponse(params: URLSearchParams): Promise<CatalogServiceResponse> {
  const query = parseCatalogQuery(params);
  const result = await fetchCatalogRows(query);

  const items = result.rows.map(mapCar);

  return {
    ok: true,
    page: query.page,
    limit: query.limit,
    total: result.total,
    pages: Math.ceil(result.total / query.limit),
    items,
  };
}

export async function getCatalogDebugResponse(params: URLSearchParams): Promise<CatalogServiceResponse> {
  const query = parseCatalogQuery(params);
  const result = await fetchCatalogRows(query);

  const items = result.rows.map(mapCar);

  return {
    ok: true,
    page: query.page,
    limit: query.limit,
    total: result.total,
    pages: Math.ceil(result.total / query.limit),
    items,
    debug: {
      whereSql: result.whereSql,
      countSql: result.countSql,
      itemsSql: result.itemsSql,
    },
  };
}
