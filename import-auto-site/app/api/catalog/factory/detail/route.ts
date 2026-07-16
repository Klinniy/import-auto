import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanParam(value: string | null) {
  return String(value || "").replace(/[^\d]/g, "").trim();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const mnfId = cleanParam(url.searchParams.get("mnf_id"));
    const mdlId = cleanParam(url.searchParams.get("mdl_id"));
    const rec = cleanParam(url.searchParams.get("rec"));

    if (!mnfId || !mdlId || !rec) {
      return NextResponse.json(
        {
          ok: false,
          error: "mnf_id, mdl_id and rec are required",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        unavailable: true,
        source: "official-cars-catalogue-not-configured",
        mnfId,
        mdlId,
        rec,
        totalSections: 0,
        sections: [],
        error: "Каталог временно недоступен",
        safeError:
          "Official Cars catalogue detail endpoint is not configured. Required provider file: /japan/search.php copied from https://ajes.com/api/search with Cars catalogue support.",
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
