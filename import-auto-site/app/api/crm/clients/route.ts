import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAllowedFromHeaders } from "@/lib/crm/access";
import { listCrmClients } from "@/lib/crm/client-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const limit = Number(req.nextUrl.searchParams.get("limit") || 500);
  return NextResponse.json({ ok: true, clients: listCrmClients(search, limit) });
}
