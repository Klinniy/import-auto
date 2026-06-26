import { NextResponse } from "next/server";
import { ajesSql } from "@/lib/ajes/client";

export async function GET() {
  try {
    const data = await ajesSql(
      "select marka_id,marka_name,count(*) from main group by marka_id order by marka_name asc"
    );

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
