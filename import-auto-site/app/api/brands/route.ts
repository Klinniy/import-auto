import { NextRequest, NextResponse } from "next/server";
import { getBrandsDictionary } from "@/lib/catalog/dictionaries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const debug = req.nextUrl.searchParams.get("debug") === "1";
    const data = await getBrandsDictionary(debug);

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
