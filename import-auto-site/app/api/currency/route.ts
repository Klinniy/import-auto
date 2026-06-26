import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("http://auc.mosaicauto.ru/currency", {
      next: { revalidate: 3600 }
    });

    const raw = await res.json();

    const data = {
      date: raw.date,
      usd: Number(raw.usd),
      eur: Number(raw.eur),
      jpy: Number(raw.jpy),
      krw: Number(raw.krw),
      cny: Number(raw.cny),
      jpyToUsd: Number(raw.jpy2usd),
      krwToUsd: Number(raw.krw2usd),
      cnyToUsd: Number(raw.cny2usd)
    };

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
