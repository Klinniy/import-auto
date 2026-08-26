import { NextRequest, NextResponse } from "next/server";
import { isCrmRequestAllowedFromHeaders } from "@/lib/crm/access";
import { addCrmClientNote, getCrmClient } from "@/lib/crm/client-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ phone: string }> | { phone: string };

export async function POST(req: NextRequest, { params }: { params: Params }) {
  if (!isCrmRequestAllowedFromHeaders(req.headers)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const { phone: rawPhone } = await params;
  const phone = decodeURIComponent(rawPhone);
  if (!getCrmClient(phone)) return NextResponse.json({ ok: false, error: "Клиент не найден" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const text = String(body?.text || "").replace(/\s+/g, " ").trim().slice(0, 5000);
  if (text.length < 2) return NextResponse.json({ ok: false, error: "Введите заметку" }, { status: 400 });

  return NextResponse.json({ ok: true, note: addCrmClientNote(phone, text) });
}
