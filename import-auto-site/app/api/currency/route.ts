import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.json();
}

async function fetchInternalCbr() {
  const bases = [
    process.env.DEBUG_INTERNAL_BASE_URL,
    `http://127.0.0.1:${process.env.PORT || "3000"}`,
    `http://localhost:${process.env.PORT || "3000"}`,
  ].filter(Boolean) as string[];

  let lastError = "";

  for (const base of bases) {
    try {
      return await fetchJson(`${base}/api/cbr?ts=${Date.now()}`);
    } catch (error) {
      lastError = String(error);
    }
  }

  throw new Error(lastError || "CBR fetch failed");
}

function n(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function GET() {
  let legacy: any = null;

  try {
    const response = await fetch("http://auc.mosaicauto.ru/currency", {
      cache: "no-store",
      headers: { accept: "application/json" },
    });

    legacy = await response.json().catch(() => null);
  } catch {
    legacy = null;
  }

  try {
    const cbr = await fetchInternalCbr();

    let jpyHistory: any = null;
    try {
      const bases = [
        process.env.DEBUG_INTERNAL_BASE_URL,
        `http://127.0.0.1:${process.env.PORT || "3000"}`,
        `http://localhost:${process.env.PORT || "3000"}`,
      ].filter(Boolean) as string[];

      for (const base of bases) {
        const response = await fetch(`${base}/api/currency/jpy-history?ts=${Date.now()}`, {
          cache: "no-store",
          headers: { accept: "application/json" },
        });

        if (response.ok) {
          jpyHistory = await response.json();
          break;
        }
      }
    } catch {
      jpyHistory = null;
    }

    const jpy = cbr?.currencies?.JPY || {};
    const cny = cbr?.currencies?.CNY || {};
    const usd = cbr?.currencies?.USD || {};
    const eur = cbr?.currencies?.EUR || {};

    const data = {
      date: legacy?.data?.date || legacy?.date || new Date().toLocaleDateString("ru-RU"),

      usd: n(usd.value) || n(legacy?.data?.usd) || n(legacy?.usd),
      eur: n(eur.value) || n(legacy?.data?.eur) || n(legacy?.eur),

      // Важно: без округления до 48.06.
      jpy: n(jpy.value) || n(legacy?.data?.jpy) || n(legacy?.jpy),

      krw: n(legacy?.data?.krw) || n(legacy?.krw),
      cny: n(cny.value) || n(legacy?.data?.cny) || n(legacy?.cny),

      jpyToUsd: n(legacy?.data?.jpyToUsd) || n(legacy?.jpyToUsd),
      krwToUsd: n(legacy?.data?.krwToUsd) || n(legacy?.krwToUsd),
      cnyToUsd: n(legacy?.data?.cnyToUsd) || n(legacy?.cnyToUsd),

      JPY: n(jpy.value),
      CNY: n(cny.value),
      USD: n(usd.value),
      EUR: n(eur.value),

      diff: {
        JPY: n(jpyHistory?.diff) || n(jpy.diff),
        CNY: n(cny.diff),
        USD: n(usd.diff),
        EUR: n(eur.diff),
      },

      currencies: cbr?.currencies || {},
    };

    return NextResponse.json(
      {
        ok: true,
        source: "CBR РФ + legacy currency",
        data,
        currency: data,
        rates: data,
        ...data,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    if (legacy) {
      return NextResponse.json({
        ok: true,
        source: "legacy currency fallback",
        data: legacy?.data || legacy,
        currency: legacy?.data || legacy,
        rates: legacy?.data || legacy,
        ...(legacy?.data || legacy),
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
