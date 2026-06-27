import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CurrencyKey = "JPY" | "CNY";

const CURRENCIES: Record<CurrencyKey, { id: string; nominalLabel: string; title: string }> = {
  JPY: {
    id: "R01820",
    nominalLabel: "100 JPY",
    title: "Японская йена",
  },
  CNY: {
    id: "R01375",
    nominalLabel: "1 CNY",
    title: "Китайский юань",
  },
};

function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

function parseCbrNumber(value: string) {
  return Number(String(value || "").replace(",", "."));
}

function pickTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

function parseDailyCurrency(xml: string, id: string) {
  const match = xml.match(new RegExp(`<Valute ID="${id}">([\\s\\S]*?)<\\/Valute>`, "i"));

  if (!match) return null;

  const block = match[1];
  const nominal = parseCbrNumber(pickTag(block, "Nominal")) || 1;
  const value = parseCbrNumber(pickTag(block, "Value"));
  const name = pickTag(block, "Name");
  const charCode = pickTag(block, "CharCode");

  if (!Number.isFinite(value)) return null;

  return {
    charCode,
    name,
    nominal,
    value,
    perOne: value / nominal,
  };
}

function parseDynamic(xml: string) {
  const records = Array.from(xml.matchAll(/<Record Date="([^"]+)"[^>]*>([\s\S]*?)<\/Record>/gi));

  return records
    .map((record) => {
      const date = record[1];
      const block = record[2];
      const nominal = parseCbrNumber(pickTag(block, "Nominal")) || 1;
      const value = parseCbrNumber(pickTag(block, "Value"));

      return {
        date,
        nominal,
        value,
        perOne: value / nominal,
      };
    })
    .filter((item) => Number.isFinite(item.value));
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "MosaicAuto/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`CBR request failed: ${res.status}`);
  }

  return res.text();
}

export async function GET() {
  try {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 45);

    const dailyXml = await fetchText("https://www.cbr.ru/scripts/XML_daily.asp");

    const entries = await Promise.all(
      (Object.entries(CURRENCIES) as Array<[CurrencyKey, typeof CURRENCIES[CurrencyKey]]>).map(
        async ([code, config]) => {
          const daily = parseDailyCurrency(dailyXml, config.id);

          const dynamicUrl =
            `https://www.cbr.ru/scripts/XML_dynamic.asp?date_req1=${formatDate(from)}` +
            `&date_req2=${formatDate(now)}&VAL_NM_RQ=${config.id}`;

          const dynamicXml = await fetchText(dynamicUrl);
          const history = parseDynamic(dynamicXml).slice(-14);

          const prev = history.length >= 2 ? history[history.length - 2] : null;
          const last = history.length >= 1 ? history[history.length - 1] : null;

          const currentValue = daily?.value || last?.value || 0;
          const previousValue = prev?.value || currentValue;
          const diff = currentValue - previousValue;
          const diffPercent = previousValue ? (diff / previousValue) * 100 : 0;

          return {
            code,
            id: config.id,
            title: config.title,
            nominalLabel: config.nominalLabel,
            nominal: daily?.nominal || last?.nominal || 1,
            value: currentValue,
            perOne: daily?.perOne || last?.perOne || 0,
            diff,
            diffPercent,
            history,
          };
        }
      )
    );

    return NextResponse.json({
      ok: true,
      source: "CBR РФ",
      checkedAt: new Date().toISOString(),
      currencies: Object.fromEntries(entries.map((item) => [item.code, item])),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "CBR РФ",
        checkedAt: new Date().toISOString(),
        error: String(error),
      },
      { status: 500 }
    );
  }
}
