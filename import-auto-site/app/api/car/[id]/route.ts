import { NextRequest, NextResponse } from "next/server";
import { ajesSql, sqlValue } from "@/lib/ajes/client";
import { mapCar } from "@/lib/catalog/mapper";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    }

    const rows = await ajesSql<Array<Record<string, string>>>(
      `select * from main where id=${sqlValue(id)}`
    );

    const car = rows[0] ? mapCar(rows[0]) : null;

    return NextResponse.json({ ok: true, id, data: car });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
