import { NextRequest, NextResponse } from "next/server";
import { ajesSql, sqlValue } from "@/lib/ajes/client";

export async function GET(req: NextRequest) {
  try {
    const brand = req.nextUrl.searchParams.get("brand") || req.nextUrl.searchParams.get("marka") || "";

    if (!brand) {
      return NextResponse.json({ ok: false, error: "brand is required" }, { status: 400 });
    }

    const rows = await ajesSql<Array<Record<string, string>>>(
      `select model_id,model_name,count(*) from main where marka_name=${sqlValue(brand)} group by model_id order by model_name asc`
    );

    const data = rows.map((x) => ({
      id: x.MODEL_ID,
      name: x.MODEL_NAME,
      count: Number(x.TAG2 || 0)
    }));

    return NextResponse.json({ ok: true, brand, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
