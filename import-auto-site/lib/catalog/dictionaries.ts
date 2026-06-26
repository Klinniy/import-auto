import { ajesSql, sqlValue } from "@/lib/ajes/client";

type RawRow = Record<string, unknown>;

export type DictionaryItem = {
  id: string;
  name: string;
  count: number;
};

export type DictionaryResponse = {
  ok: true;
  data: DictionaryItem[];
  meta: {
    durationMs: number;
    rows: number;
  };
  debug?: {
    sql: string;
  };
};

export type ModelDictionaryResponse = DictionaryResponse & {
  brand: string;
};

function nowMs() {
  return Date.now();
}

function firstValue(row: RawRow, names: string[]) {
  for (const name of names) {
    const value = row[name];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function toCount(value: unknown) {
  const n = Number(value);

  return Number.isFinite(n) ? n : 0;
}

function mapDictionaryRow(row: RawRow, kind: "brand" | "model"): DictionaryItem {
  if (kind === "brand") {
    return {
      id: firstValue(row, ["id", "ID", "marka_id", "MARKA_ID", "MARKA"]),
      name: firstValue(row, ["name", "NAME", "marka_name", "MARKA_NAME"]),
      count: toCount(firstValue(row, ["count", "COUNT", "count(*)", "COUNT(*)"])),
    };
  }

  return {
    id: firstValue(row, ["id", "ID", "model_id", "MODEL_ID", "MODEL"]),
    name: firstValue(row, ["name", "NAME", "model_name", "MODEL_NAME"]),
    count: toCount(firstValue(row, ["count", "COUNT", "count(*)", "COUNT(*)"])),
  };
}

function cleanItems(items: DictionaryItem[]) {
  return items
    .filter((item) => item.name)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export async function getBrandsDictionary(debug = false): Promise<DictionaryResponse> {
  const started = nowMs();

  const sql =
    "select marka_id as id, marka_name as name, count(*) as count " +
    "from main " +
    "group by marka_id, marka_name " +
    "order by marka_name";

  const rows = await ajesSql<RawRow[]>(sql);
  const data = cleanItems(rows.map((row) => mapDictionaryRow(row, "brand")));

  return {
    ok: true,
    data,
    meta: {
      durationMs: nowMs() - started,
      rows: data.length,
    },
    ...(debug ? { debug: { sql } } : {}),
  };
}

export async function getModelsDictionary(
  brand: string,
  debug = false
): Promise<ModelDictionaryResponse> {
  const started = nowMs();
  const cleanBrand = String(brand || "").trim();

  const whereSql = cleanBrand
    ? ` where marka_name=${sqlValue(cleanBrand)}`
    : "";

  const sql =
    "select model_id as id, model_name as name, count(*) as count " +
    `from main${whereSql} ` +
    "group by model_id, model_name " +
    "order by model_name";

  const rows = await ajesSql<RawRow[]>(sql);
  const data = cleanItems(rows.map((row) => mapDictionaryRow(row, "model")));

  return {
    ok: true,
    brand: cleanBrand,
    data,
    meta: {
      durationMs: nowMs() - started,
      rows: data.length,
    },
    ...(debug ? { debug: { sql } } : {}),
  };
}
