import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAllowedFromHeaders } from "@/lib/crm/access";
import { getPurchaseLeadStats, listPurchaseLeads } from "@/lib/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const market = searchParams.get("market") || "";
  const limit = Number(searchParams.get("limit") || 100);

  const leads = listPurchaseLeads({ search, status, market, limit });
  const stats = getPurchaseLeadStats();

  return NextResponse.json(
    { ok: true, leads, stats },
    { headers: { "Cache-Control": "no-store, private" } }
  );
}
