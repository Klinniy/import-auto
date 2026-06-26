import { ajesSql } from "@/lib/ajes/client";
import { getBrandsDictionary } from "@/lib/catalog/dictionaries";

type RawRow = Record<string, unknown>;

export type FilterOption = {
  value: string;
  label: string;
  count: number;
};

export type CatalogFiltersResponse = {
  ok: true;
  filters: {
    brands: FilterOption[];
    years: FilterOption[];
    auctions: FilterOption[];
    transmissions: FilterOption[];
    drives: FilterOption[];
    rates: FilterOption[];
    colors: FilterOption[];
  };
  meta: {
    durationMs: number;
    groups: Record<string, number>;
  };
  debug?: {
    sql: Record<string, string>;
    notes: string[];
  };
};

function nowMs() {
  return Date.now();
}

function value(row: RawRow, names: string[]) {
  for (const name of names) {
    const v = row[name];

    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }

  return "";
}

function countValue(row: RawRow) {
  const raw = value(row, ["TAG2", "TAG1", "COUNT(*)", "count(*)", "COUNT", "count"]);
  const n = Number(raw);

  return Number.isFinite(n) ? n : 0;
}

function normalizeOptionText(raw: string) {
  return String(raw || "").trim();
}

function isFilterOption(value: FilterOption | null): value is FilterOption {
  return value !== null;
}

function optionFromRow(row: RawRow, fieldNames: string[]): FilterOption | null {
  const text = normalizeOptionText(value(row, fieldNames));

  if (!text || text === "-" || text.toLowerCase() === "null") {
    return null;
  }

  return {
    value: text,
    label: text,
    count: countValue(row),
  };
}

function sortText(a: FilterOption, b: FilterOption) {
  return a.label.localeCompare(b.label, "ru");
}

function sortYearsDesc(a: FilterOption, b: FilterOption) {
  return Number(b.value) - Number(a.value);
}

async function groupedOptions(
  sql: string,
  fieldNames: string[],
  sorter: (a: FilterOption, b: FilterOption) => number = sortText
): Promise<FilterOption[]> {
  const rows = await ajesSql<RawRow[]>(sql);

  return rows
    .map((row) => optionFromRow(row, fieldNames))
    .filter(isFilterOption)
    .sort(sorter);
}

export async function getCatalogFilters(debug = false): Promise<CatalogFiltersResponse> {
  const started = nowMs();

  const sql = {
    years:
      "select year,count(*) from main " +
      "group by year " +
      "order by year desc",

    auctions:
      "select auction,count(*) from main " +
      "group by auction " +
      "order by auction asc",

    transmissions:
      "select kpp,count(*) from main " +
      "group by kpp " +
      "order by kpp asc",

    drives:
      "select priv,count(*) from main " +
      "group by priv " +
      "order by priv asc",

    rates:
      "select rate,count(*) from main " +
      "group by rate " +
      "order by rate asc",

    colors:
      "select color,count(*) from main " +
      "group by color " +
      "order by color asc",
  };

  const brandsRaw = await getBrandsDictionary(false);

  const brands = brandsRaw.data.map((item) => ({
    value: item.name,
    label: item.name,
    count: item.count,
  }));

  const [years, auctions, transmissions, drives, rates, colors] = await Promise.all([
    groupedOptions(sql.years, ["YEAR", "year"], sortYearsDesc),
    groupedOptions(sql.auctions, ["AUCTION", "auction"]),
    groupedOptions(sql.transmissions, ["KPP", "kpp"]),
    groupedOptions(sql.drives, ["PRIV", "priv"]),
    groupedOptions(sql.rates, ["RATE", "rate"]),
    groupedOptions(sql.colors, ["COLOR", "color"]),
  ]);

  const filters = {
    brands,
    years,
    auctions,
    transmissions,
    drives,
    rates,
    colors,
  };

  return {
    ok: true,
    filters,
    meta: {
      durationMs: nowMs() - started,
      groups: {
        brands: brands.length,
        years: years.length,
        auctions: auctions.length,
        transmissions: transmissions.length,
        drives: drives.length,
        rates: rates.length,
        colors: colors.length,
      },
    },
    ...(debug
      ? {
          debug: {
            sql,
            notes: [
              "Brands are loaded from Dictionary Service.",
              "AJES grouped count is read from TAG2.",
              "Filter values are intended for catalog UI dropdowns.",
            ],
          },
        }
      : {}),
  };
}
