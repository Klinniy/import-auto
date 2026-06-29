import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchCbr() {
  const bases = [
    process.env.DEBUG_INTERNAL_BASE_URL,
    `http://127.0.0.1:${process.env.PORT || "3000"}`,
    `http://localhost:${process.env.PORT || "3000"}`,
  ].filter(Boolean) as string[];

  let lastError = "";

  for (const base of bases) {
    try {
      const response = await fetch(`${base}/api/cbr?ts=${Date.now()}`, {
        cache: "no-store",
        headers: { accept: "application/json" },
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status} from ${base}`;
        continue;
      }

      return await response.json();
    } catch (error) {
      lastError = `${base}: ${String(error)}`;
    }
  }

  throw new Error(lastError || "CBR fetch failed");
}

export async function GET() {
  try {
    const json = await fetchCbr();

    const jpy = json?.currencies?.JPY || {};
    const history = Array.isArray(jpy?.history) ? jpy.history : [];

    const points = history.map((item: any) => ({
      date: item.date,
      value: Number(item.value || 0),
      perOne: Number(item.perOne || 0),
      nominal: Number(item.nominal || 100),
    }));

    const currentValue = Number(jpy.value || 0);
    const currentDate = new Date().toLocaleDateString("ru-RU");

    if (currentValue > 0) {
      const last = points[points.length - 1];

      if (!last || Math.abs(Number(last.value || 0) - currentValue) > 0.0001) {
        points.push({
          date: currentDate,
          value: currentValue,
          perOne: Number(jpy.perOne || currentValue / 100),
          nominal: Number(jpy.nominal || 100),
        });
      }
    }

    const finalValue = currentValue || Number(points.at(-1)?.value || 0);
    const previousPoint = points.length >= 2 ? points[points.length - 2] : null;
    const previousValue = Number(previousPoint?.value || 0);

    const visualDiff =
      finalValue > 0 && previousValue > 0
        ? finalValue - previousValue
        : Number(jpy.diff || 0);

    const visualDiffPercent =
      previousValue > 0 ? (visualDiff / previousValue) * 100 : Number(jpy.diffPercent || 0);

    return NextResponse.json(
      {
        ok: true,
        source: "CBR РФ",
        currency: "JPY",
        code: "JPY",
        title: jpy.title || "Японская йена",
        nominal: jpy.nominal || 100,
        nominalLabel: jpy.nominalLabel || "100 JPY",
        value: finalValue,
        diff: visualDiff,
        diffPercent: visualDiffPercent,

        history: points,
        points,
        data: points,
        items: points,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error),
        history: [],
        points: [],
        data: [],
        items: [],
      },
      { status: 500 }
    );
  }
}
