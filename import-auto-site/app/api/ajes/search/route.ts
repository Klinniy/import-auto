import { NextRequest, NextResponse } from "next/server";
import { ajesSql, normalizeImages, sqlLike, sqlValue, toInt } from "@/lib/ajes/client";

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;

    const marka = p.get("marka") || "";
    const model = p.get("model") || "";
    const q = p.get("q") || "";
    const yearFrom = p.get("yearFrom");
    const yearTo = p.get("yearTo");
    const priceFrom = p.get("priceFrom");
    const priceTo = p.get("priceTo");
    const page = toInt(p.get("page"), 1, 1, 10000);
    const limit = toInt(p.get("limit"), 24, 1, 100);
    const offset = (page - 1) * limit;

    const where: string[] = [];

    if (marka) where.push(`marka_name=${sqlValue(marka)}`);
    if (model) where.push(`model_name=${sqlValue(model)}`);
    if (q) where.push(`(marka_name like ${sqlLike(q)} or model_name like ${sqlLike(q)} or kuzov like ${sqlLike(q)} or lot like ${sqlLike(q)})`);
    if (yearFrom) where.push(`year>=${toInt(yearFrom, 1900, 1900, 2100)}`);
    if (yearTo) where.push(`year<=${toInt(yearTo, 2100, 1900, 2100)}`);
    if (priceFrom) where.push(`avg_price>=${toInt(priceFrom, 0, 0, 999999999)}`);
    if (priceTo) where.push(`avg_price<=${toInt(priceTo, 999999999, 0, 999999999)}`);

    const whereSql = where.length ? " where " + where.join(" and ") : "";

    const countRows = await ajesSql<Array<Record<string, string>>>(`select count(*) from main${whereSql}`);
    const total = Number(countRows?.[0]?.TAG0 || countRows?.[0]?.["COUNT(*)"] || 0);

    const rows = await ajesSql<Array<Record<string, string>>>(
      `select * from main${whereSql} order by auction_date asc limit ${offset},${limit}`
    );

    const data = rows.map((row) => ({
      ...row,
      imagesParsed: normalizeImages(row.IMAGES)
    }));

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      data
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
