import { NextRequest, NextResponse } from "next/server";
import { getModelsDictionary } from "@/lib/catalog/dictionaries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const brand =
      req.nextUrl.searchParams.get("brand") ||
      req.nextUrl.searchParams.get("marka") ||
      req.nextUrl.searchParams.get("markaName") ||
      "";

    const debug = req.nextUrl.searchParams.get("debug") === "1";

    const data = await getModelsDictionary(brand, debug);

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
