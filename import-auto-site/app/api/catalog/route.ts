import { NextRequest, NextResponse } from "next/server";
import { ajesSql, toInt } from "@/lib/ajes/client";
import { buildCatalogWhere, getCountValue } from "@/lib/catalog/sql";
import { mapCar } from "@/lib/catalog/mapper";

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;

    const page = toInt(p.get("page"), 1, 1, 10000);
    const limit = toInt(p.get("limit"), 24, 1, 100);
    const offset = (page - 1) * limit;

    const whereSql = buildCatalogWhere({
      brand: p.get("brand") || p.get("marka") || "",
      model: p.get("model") || "",
      q: p.get("q") || "",
      yearFrom: p.get("yearFrom") || "",
      yearTo: p.get("yearTo") || "",
      priceFrom: p.get("priceFrom") || "",
      priceTo: p.get("priceTo") || "",
      mileageTo: p.get("mileageTo") || "",
      rateFrom: p.get("rateFrom") || "",
      auction: p.get("auction") || ""
    });

    const countRows = await ajesSql<Array<Record<string, string>>>(`select count(*) from main${whereSql}`);
    const total = getCountValue(countRows[0]);

    const rows = await ajesSql<Array<Record<string, string>>>(
      `select * from main${whereSql} order by auction_date asc limit ${offset},${limit}`
    );

    const items = rows.map(mapCar);

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
