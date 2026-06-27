import { NextRequest, NextResponse } from "next/server";
import { ajesSql, sqlValue } from "@/lib/ajes/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let cachedFields: Set<string> | null = null;

function clean(value: string | null) {
  return String(value || "").trim();
}

function cleanInt(value: string | null) {
  const n = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function isSafeField(field: string) {
  return /^[a-zA-Z0-9_]+$/.test(field);
}

async function getFields() {
  if (cachedFields) return cachedFields;

  const rows = await ajesSql<Array<Record<string, string>>>("select * from main limit 0,1");
  cachedFields = new Set(Object.keys(rows?.[0] || {}).filter(isSafeField));

  return cachedFields;
}

function pickField(fields: Set<string>, aliases: string[]) {
  for (const alias of aliases) {
    for (const field of fields) {
      if (field.toLowerCase() === alias.toLowerCase()) return field;
    }
  }

  return "";
}

function like(value: string) {
  return sqlValue(`%${value}%`);
}

async function buildWhere(params: URLSearchParams) {
  const fields = await getFields();
  const where: string[] = [];

  const field = {
    id: pickField(fields, ["ID", "id"]),
    lot: pickField(fields, ["LOT", "lot"]),
    brand: pickField(fields, ["MARKA_NAME", "marka_name", "brand"]),
    model: pickField(fields, ["MODEL_NAME", "model_name", "model"]),
    year: pickField(fields, ["YEAR", "year"]),
    mileage: pickField(fields, ["MILEAGE", "mileage"]),
    auction: pickField(fields, ["AUCTION", "auction"]),
    rate: pickField(fields, ["RATE", "rate"]),
    body: pickField(fields, ["KUZOV", "kuzov", "body"]),
    color: pickField(fields, ["COLOR", "color"]),
    transmission: pickField(fields, ["KPP", "kpp", "transmission"]),
    drive: pickField(fields, ["PRIV", "priv", "drive"]),
    status: pickField(fields, ["STATUS", "status"]),
    sanction: pickField(fields, ["SANCTION", "sanction"]),
    leftHandDrive: pickField(fields, ["LHDRIVE", "lhd", "left_hand_drive"]),
  };

  const brand = clean(params.get("brand"));
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

  if (brand && field.brand) where.push(`${field.brand}=${sqlValue(brand)}`);
  if (model && field.model) where.push(`${field.model}=${sqlValue(model)}`);

  if (q) {
    const parts: string[] = [];

    if (field.lot) parts.push(`${field.lot}=${sqlValue(q)}`);
    if (field.id) parts.push(`${field.id}=${sqlValue(q)}`);
    if (field.brand) parts.push(`${field.brand} like ${like(q)}`);
    if (field.model) parts.push(`${field.model} like ${like(q)}`);

    if (parts.length) where.push(`(${parts.join(" or ")})`);
  }

  if (yearFrom && field.year) where.push(`${field.year}>=${yearFrom}`);
  if (yearTo && field.year) where.push(`${field.year}<=${yearTo}`);
  if (mileageTo && field.mileage) where.push(`${field.mileage}<=${mileageTo}`);

  if (auction && field.auction) where.push(`${field.auction}=${sqlValue(auction)}`);
  if (rateFrom && field.rate) where.push(`${field.rate}>=${sqlValue(rateFrom)}`);
  if (body && field.body) where.push(`${field.body} like ${like(body)}`);
  if (color && field.color) where.push(`${field.color}=${sqlValue(color)}`);
  if (transmission && field.transmission) where.push(`${field.transmission}=${sqlValue(transmission)}`);
  if (drive && field.drive) where.push(`${field.drive}=${sqlValue(drive)}`);
  if (status && field.status) where.push(`${field.status}=${sqlValue(status === "sold" ? "Sold" : "Not Sold")}`);
  if (sanction && field.sanction) where.push(`${field.sanction}=${Number(sanction)}`);
  if (leftHandDrive && field.leftHandDrive) where.push(`${field.leftHandDrive}=${Number(leftHandDrive)}`);

  return {
    whereSql: where.length ? ` where ${where.join(" and ")}` : "",
    field,
  };
}


function cleanFacetValue(value: unknown) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isBadFacetValue(value: string) {
  const text = value.toLowerCase();

  return (
    !text ||
    text.includes("actual vehicle") ||
    text.includes("vehicle") ||
    text.includes("http") ||
    text.includes("{") ||
    text.length > 32
  );
}

function buildFacet(rows: Array<Record<string, string>>, fieldName: string, limit = 12) {
  if (!fieldName) return [];

  const map = new Map<string, number>();

  for (const row of rows) {
    const value = cleanFacetValue(row[fieldName]);

    if (isBadFacetValue(value)) continue;

    map.set(value, (map.get(value) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export async function GET(req: NextRequest) {
  try {
    const { whereSql, field } = await buildWhere(req.nextUrl.searchParams);

    const wantedFields = [
      field.body,
      field.rate,
      field.auction,
      field.color,
      field.status,
      field.transmission,
      field.drive,
    ].filter(Boolean);

    const selectFields = Array.from(new Set(wantedFields)).join(",");

    const rows = selectFields
      ? await ajesSql<Array<Record<string, string>>>(
          `select ${selectFields} from main${whereSql} limit 0,5000`
        )
      : [];

    return NextResponse.json({
      ok: true,
      whereSql,
      scannedRows: rows.length,
      facets: {
        bodies: buildFacet(rows, field.body, 10),
        rates: buildFacet(rows, field.rate, 10),
        auctions: buildFacet(rows, field.auction, 12),
        colors: buildFacet(rows, field.color, 12),
        statuses: buildFacet(rows, field.status, 8),
        transmissions: buildFacet(rows, field.transmission, 10),
        drives: buildFacet(rows, field.drive, 8),
      },
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
