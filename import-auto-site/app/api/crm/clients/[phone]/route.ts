import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAllowedFromHeaders } from "@/lib/crm/access";
import { getCrmClient } from "@/lib/crm/client-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ phone: string }> | { phone: string };

export async function GET(req: NextRequest, { params }: { params: Params }) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const { phone } = await params;
  const client = getCrmClient(decodeURIComponent(phone));
  if (!client) return NextResponse.json({ ok: false, error: "Клиент не найден" }, { status: 404 });
  return NextResponse.json({ ok: true, client });
}
