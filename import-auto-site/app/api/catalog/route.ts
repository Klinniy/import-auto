import { NextRequest, NextResponse } from "next/server";
import { getCatalogResponse, getCatalogDebugResponse } from "@/lib/catalog/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const debug = req.nextUrl.searchParams.get("debug") === "1";

    const data = debug
      ? await getCatalogDebugResponse(req.nextUrl.searchParams)
      : await getCatalogResponse(req.nextUrl.searchParams);

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
