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
    note: string;
  };
};

export type ModelDictionaryResponse = DictionaryResponse & {
  brand: string;
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

function cleanItems(items: DictionaryItem[]) {
  return items
    .filter((item) => item.name)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function mapBrandRow(row: RawRow): DictionaryItem {
  return {
    id: value(row, ["MARKA_ID", "marka_id"]),
    name: value(row, ["MARKA_NAME", "marka_name"]),
    count: countValue(row),
  };
}

function mapModelRow(row: RawRow): DictionaryItem {
  return {
    id: value(row, ["MODEL_ID", "model_id"]),
    name: value(row, ["MODEL_NAME", "model_name"]),
    count: countValue(row),
  };
}

export async function getBrandsDictionary(debug = false): Promise<DictionaryResponse> {
  const started = nowMs();

  /*
    Важно для AJES:
    не используем SQL alias: "as id", "as name", "as count".
    Старый рабочий запрос возвращал MARKA_ID / MARKA_NAME / TAG2.
  */
  const sql =
    "select marka_id,marka_name,count(*) from main " +
    "group by marka_id " +
    "order by marka_name asc";

  const rows = await ajesSql<RawRow[]>(sql);
  const data = cleanItems(rows.map(mapBrandRow));

  return {
    ok: true,
    data,
    meta: {
      durationMs: nowMs() - started,
      rows: data.length,
    },
    ...(debug
      ? {
          debug: {
            sql,
            note: "AJES returns MARKA_ID, MARKA_NAME and count in TAG2",
          },
        }
      : {}),
  };
}

export async function getModelsDictionary(
  brand: string,
  debug = false
): Promise<ModelDictionaryResponse> {
  const started = nowMs();
  const cleanBrand = String(brand || "").trim();

  /*
    Если brand не передан, возвращаем общий список моделей.
    Это нужно для Debug Center и не ломает основной UI: CatalogFull обычно передает brand.
  */
  const whereSql = cleanBrand
    ? ` where marka_name=${sqlValue(cleanBrand)}`
    : "";

  /*
    Важно для AJES:
    не используем SQL alias.
    Старый рабочий запрос возвращал MODEL_ID / MODEL_NAME / TAG2.
  */
  const sql =
    `select model_id,model_name,count(*) from main${whereSql} ` +
    "group by model_id " +
    "order by model_name asc";

  const rows = await ajesSql<RawRow[]>(sql);
  const data = cleanItems(rows.map(mapModelRow));

  return {
    ok: true,
    brand: cleanBrand,
    data,
    meta: {
      durationMs: nowMs() - started,
      rows: data.length,
    },
    ...(debug
      ? {
          debug: {
            sql,
            note: "AJES returns MODEL_ID, MODEL_NAME and count in TAG2",
          },
        }
      : {}),
  };
}
