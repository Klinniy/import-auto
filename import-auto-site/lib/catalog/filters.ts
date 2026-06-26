import { toInt } from "@/lib/ajes/client";
import type { CatalogFilters } from "@/lib/catalog/sql";

export type CatalogQuery = CatalogFilters & {
  page: number;
  limit: number;
  offset: number;
};

export function getFirstParam(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = params.get(name);

    if (value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const page = toInt(params.get("page"), 1, 1, 10000);
  const limit = toInt(params.get("limit"), 24, 1, 100);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,

    brand: getFirstParam(params, ["brand", "marka", "markaName"]),
    model: getFirstParam(params, ["model", "modelName"]),
    q: getFirstParam(params, ["q", "search", "query"]),

    yearFrom: getFirstParam(params, ["yearFrom", "year_from"]),
    yearTo: getFirstParam(params, ["yearTo", "year_to"]),

    priceFrom: getFirstParam(params, ["priceFrom", "price_from"]),
    priceTo: getFirstParam(params, ["priceTo", "price_to"]),

    mileageTo: getFirstParam(params, ["mileageTo", "mileage_to"]),

    rateFrom: getFirstParam(params, ["rateFrom", "rate_from"]),

    auction: getFirstParam(params, ["auction"]),
  };
}
