import { NextRequest, NextResponse } from "next/server";
import { ajesSql, sqlValue } from "@/lib/ajes/client";

export async function GET(req: NextRequest) {
  try {
    const marka = req.nextUrl.searchParams.get("marka") || "";

    if (!marka) {
      return NextResponse.json({ ok: false, error: "marka is required" }, { status: 400 });
    }

    const data = await ajesSql(
      `select model_id,model_name,count(*) from main where marka_name=${sqlValue(marka)} group by model_id order by model_name asc`
    );

    return NextResponse.json({ ok: true, marka, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
