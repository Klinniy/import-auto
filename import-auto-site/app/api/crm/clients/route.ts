import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAllowedFromHeaders } from "@/lib/crm/access";
import { listCrmClientsFiltered } from "@/lib/crm/client-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const phone = req.nextUrl.searchParams.get("phone") || "";
  const name = req.nextUrl.searchParams.get("name") || "";
  const city = req.nextUrl.searchParams.get("city") || "";
  const limit = Number(req.nextUrl.searchParams.get("limit") || 500);

  return NextResponse.json({
    ok: true,
    clients: listCrmClientsFiltered({ phone, name, city }, limit),
  });
}
