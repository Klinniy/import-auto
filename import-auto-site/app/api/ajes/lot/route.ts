import { NextRequest, NextResponse } from "next/server";
import { ajesSql, normalizeImages, sqlValue } from "@/lib/ajes/client";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }

    const rows = await ajesSql<Array<Record<string, string>>>(
      `select * from main where id=${sqlValue(id)}`
    );

    const lot = rows[0] || null;

    return NextResponse.json({
      ok: true,
      id,
      data: lot ? { ...lot, imagesParsed: normalizeImages(lot.IMAGES) } : null
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
