import { NextRequest, NextResponse } from "next/server";
import { ajesSql, sqlValue, toInt } from "@/lib/ajes/client";
import { getCountValue } from "@/lib/catalog/sql";
import { mapCar } from "@/lib/catalog/mapper";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let cachedFields: Set<string> | null = null;

function clean(value: string | null) {
  return String(value || "").trim();
}

function cleanInt(value: string | null, fallback = 0) {
  const n = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function isSafeField(field: string) {
  return /^[a-zA-Z0-9_]+$/.test(field);
}

async function getFields() {
  if (cachedFields) return cachedFields;

  const rows = await ajesSql<Array<Record<string, string>>>(
    "select * from main limit 0,1"
  );

  cachedFields = new Set(Object.keys(rows?.[0] || {}).filter(isSafeField));

  return cachedFields;
}

function pickField(fields: Set<string>, aliases: string[]) {
  /*
    AJES возвращает имена колонок в верхнем регистре:
    MARKA_NAME, MODEL_NAME, YEAR, MILEAGE и т.д.

    Поэтому ищем поле без учета регистра, но возвращаем реальное имя поля
    из ответа API, чтобы SQL строился корректно.
  */
  for (const alias of aliases) {
    for (const field of fields) {
      if (field.toLowerCase() === alias.toLowerCase()) {
        return field;
      }
    }
  }

  return "";
}

function like(value: string) {
  return sqlValue(`%${value}%`);
}

function addEqual(where: string[], field: string, value: string) {
  if (!field || !value) return;
  where.push(`${field}=${sqlValue(value)}`);
}

function addLike(where: string[], field: string, value: string) {
  if (!field || !value) return;
  where.push(`${field} like ${like(value)}`);
}

function addNumberGte(where: string[], field: string, value: number) {
  if (!field || !value) return;
  where.push(`${field}>=${value}`);
}

function addNumberLte(where: string[], field: string, value: number) {
  if (!field || !value) return;
  where.push(`${field}<=${value}`);
}

function normalizeStatus(value: string) {
  const v = value.toLowerCase();

  if (!v) return "";

  if (v === "sold" || v === "продан") return "Sold";
  if (v === "not_sold" || v === "not sold" || v === "не продан") return "Not Sold";

  return value;
}

async function buildWhere(params: URLSearchParams) {
  const fields = await getFields();
  const where: string[] = [];

  const field = {
    id: pickField(fields, ["id"]),
    lot: pickField(fields, ["lot"]),
    brand: pickField(fields, ["marka_name", "marka", "brand", "make"]),
    model: pickField(fields, ["model_name", "model"]),
    year: pickField(fields, ["year"]),
    mileage: pickField(fields, ["mileage", "probeg"]),
    auction: pickField(fields, ["auction", "auction_name"]),
    rate: pickField(fields, ["rate", "grade", "ocenka"]),
    body: pickField(fields, ["kuzov", "body"]),
    color: pickField(fields, ["color", "cvet"]),
    transmission: pickField(fields, ["kpp", "transmission"]),
    drive: pickField(fields, ["priv", "drive"]),
    status: pickField(fields, ["status"]),
    start: pickField(fields, ["start", "start_price"]),
    finish: pickField(fields, ["finish", "finish_price"]),
    sanction: pickField(fields, ["sanction"]),
    leftHandDrive: pickField(fields, ["LHDRIVE", "lhd", "left_hand_drive"]),
  };

  const brand = clean(params.get("brand") || params.get("marka"));
  const model = clean(params.get("model"));
  const q = clean(params.get("q"));

  const yearFrom = cleanInt(params.get("yearFrom"));
  const yearTo = cleanInt(params.get("yearTo"));
  const mileageTo = cleanInt(params.get("mileageTo"));

  const auction = clean(params.get("auction"));
  const rateFrom = clean(params.get("rateFrom"));
  const body = clean(params.get("body"));
  const color = clean(params.get("color"));
  const transmission = clean(params.get("transmission"));
  const drive = clean(params.get("drive"));
  const status = clean(params.get("status"));
  const sanction = clean(params.get("sanction"));
  const leftHandDrive = clean(params.get("leftHandDrive"));

  addEqual(where, field.brand, brand);
  addEqual(where, field.model, model);

  if (q) {
    const parts: string[] = [];

    if (field.lot) parts.push(`${field.lot}=${sqlValue(q)}`);
    if (field.id) parts.push(`${field.id}=${sqlValue(q)}`);
    if (field.brand) parts.push(`${field.brand} like ${like(q)}`);
    if (field.model) parts.push(`${field.model} like ${like(q)}`);
    if (field.body) parts.push(`${field.body} like ${like(q)}`);
    if (field.auction) parts.push(`${field.auction} like ${like(q)}`);
    if (field.color) parts.push(`${field.color} like ${like(q)}`);

    if (parts.length) where.push(`(${parts.join(" or ")})`);
  }

  addNumberGte(where, field.year, yearFrom);
  addNumberLte(where, field.year, yearTo);
  addNumberLte(where, field.mileage, mileageTo);

  if (rateFrom && field.rate) {
    if (["R", "RA", "*", "***"].includes(rateFrom)) {
      addEqual(where, field.rate, rateFrom);
    } else {
      where.push(`${field.rate}>=${sqlValue(rateFrom)}`);
    }
  }

  addEqual(where, field.auction, auction);
  addLike(where, field.body, body);
  if (color && field.color) {
    const c = color.toLowerCase();

    const colorVariants: Record<string, string[]> = {
      black: ["black", "BLACK", "Black"],
      white: ["white", "WHITE", "White"],
      silver: ["silver", "SILVER", "Silver"],
      pearl: ["pearl", "PEARL", "Pearl"],
      gray: ["gray", "GRAY", "Gray", "grey", "GREY", "Grey"],
      blue: ["blue", "BLUE", "Blue"],
      red: ["red", "RED", "Red"],
      brown: ["brown", "BROWN", "Brown"],
      green: ["green", "GREEN", "Green"],
      yellow: ["yellow", "YELLOW", "Yellow"],
      gold: ["gold", "GOLD", "Gold"],
      beige: ["beige", "BEIGE", "Beige"],
      orange: ["orange", "ORANGE", "Orange"],
    };

    const variants = colorVariants[c] || [color];
    where.push(`(${variants.map((item) => `${field.color}=${sqlValue(item)}`).join(" or ")})`);
  }
  addEqual(where, field.transmission, transmission);
  addEqual(where, field.drive, drive);

  if (status && field.status) {
    addEqual(where, field.status, normalizeStatus(status));
  }

  if (sanction === "1" && field.sanction) {
    where.push(`${field.sanction}=1`);
  }

  if (sanction === "0" && field.sanction) {
    where.push(`${field.sanction}=0`);
  }

  if (leftHandDrive === "1" && field.leftHandDrive) {
    where.push(`${field.leftHandDrive}=1`);
  }

  if (leftHandDrive === "0" && field.leftHandDrive) {
    where.push(`${field.leftHandDrive}=0`);
  }

  return {
    whereSql: where.length ? ` where ${where.join(" and ")}` : "",
    fieldsFound: field,
    allFields: Array.from(fields).sort(),
  };
}

async function orderSql(sort: string | null) {
  const fields = await getFields();

  const year = pickField(fields, ["year"]);
  const mileage = pickField(fields, ["mileage", "probeg"]);
  const finish = pickField(fields, ["finish", "finish_price"]);
  const start = pickField(fields, ["start", "start_price"]);
  const auctionDate = pickField(fields, ["auction_date", "auctionDate", "date"]);

  if (sort === "year_desc" && year) return `${year} desc`;
  if (sort === "year_asc" && year) return `${year} asc`;
  if (sort === "mileage_asc" && mileage) return `${mileage} asc`;
  if (sort === "mileage_desc" && mileage) return `${mileage} desc`;
  if (sort === "price_asc" && finish) return `${finish} asc`;
  if (sort === "price_desc" && finish) return `${finish} desc`;
  if (sort === "start_asc" && start) return `${start} asc`;
  if (sort === "start_desc" && start) return `${start} desc`;

  return auctionDate ? `${auctionDate} asc` : "id desc";
}

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;

    const page = toInt(p.get("page"), 1, 1, 10000);
    const limit = toInt(p.get("limit"), 24, 1, 100);
    const offset = (page - 1) * limit;

    const { whereSql, fieldsFound, allFields } = await buildWhere(p);
    const order = await orderSql(p.get("sort"));

    const countRows = await ajesSql<Array<Record<string, string>>>(
      `select count(*) from main${whereSql}`
    );

    const total = getCountValue(countRows[0]);

    const rows = await ajesSql<Array<Record<string, string>>>(
      `select * from main${whereSql} order by ${order} limit ${offset},${limit}`
    );

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      items: rows.map(mapCar),
      debug: p.get("debug") === "1"
        ? {
            whereSql,
            order,
            fieldsFound,
            allFields,
          }
        : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
