import { NextRequest, NextResponse } from "next/server";
import { getCatalogFilters } from "@/lib/catalog/filter-options";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const debug = req.nextUrl.searchParams.get("debug") === "1";
    const data = await getCatalogFilters(debug);

    return NextResponse.json(data);
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
