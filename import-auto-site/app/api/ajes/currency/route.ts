import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://auc.mosaicauto.ru/currency", {
      next: { revalidate: 3600 }
    });

    const data = await res.json();

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
