import { NextResponse } from "next/server";
import { ajesSql } from "@/lib/ajes/client";

export async function GET() {
  try {
    const rows = await ajesSql<Array<Record<string, string>>>(
      "select marka_id,marka_name,count(*) from main group by marka_id order by marka_name asc"
    );

    const data = rows.map((x) => ({
      id: x.MARKA_ID,
      name: x.MARKA_NAME,
      count: Number(x.TAG2 || 0)
    }));

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
