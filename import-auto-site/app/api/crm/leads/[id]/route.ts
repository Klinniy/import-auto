import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAllowedFromHeaders } from "@/lib/crm/access";
import {
  CRM_LEAD_STATUSES,
  getPurchaseLead,
  updatePurchaseLeadStatus,
  type CrmLeadStatus,
} from "@/lib/leads/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }> | { id: string };

async function resolveId(params: Params) {
  const value = await params;
  return String(value?.id || "").trim();
}

function deny() {
  return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
}

export async function GET(req: NextRequest, context: { params: Params }) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) return deny();

  const id = await resolveId(context.params);
  const lead = getPurchaseLead(id);

  if (!lead) {
    return NextResponse.json({ ok: false, error: "Заявка не найдена" }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, lead },
    { headers: { "Cache-Control": "no-store, private" } }
  );
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) return deny();

  const id = await resolveId(context.params);
  const body = await req.json().catch(() => null);
  const status = String(body?.status || "").trim() as CrmLeadStatus;

  if (!CRM_LEAD_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "Некорректный статус" }, { status: 400 });
  }

  const lead = updatePurchaseLeadStatus(id, status);

  if (!lead) {
    return NextResponse.json({ ok: false, error: "Заявка не найдена" }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, lead },
    { headers: { "Cache-Control": "no-store, private" } }
  );
}
