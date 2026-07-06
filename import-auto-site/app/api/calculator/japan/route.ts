import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type FuelCode = 1 | 2 | 3 | 4 | 5;
type TaxMode = 0 | 1 | 2;

type RubCurrency = {
  date: string;
  usd: number;
  eur: number;
  jpy: number;
  jpyPerOne: number;
  jpy2usd: number;
  source: string;
};

type CalcosResult = {
  sum: number;
  fiz: number;
  jur: number;
  fizInfo: string;
  jurInfo: string;
  taxModeResult: string;
  rates: {
    usdRub: number;
    eurRub: number;
    jpyRub: number;
  };
  rawXml: string;
};

type CalcRow = {
  label: string;
  sourceValue: number;
  sourceCurrency: "JPY" | "USD" | "RUB";
  rub: number;
  formatted: string;
};

type CalcSection = {
  title: string;
  rows: CalcRow[];
  totalRub: number;
  formattedTotal: string;
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function fmtRub(value: number) {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value || 0))} ₽`;
}

function parseXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

function parseCbrValue(xml: string, id: string) {
  const match = xml.match(new RegExp(`<Valute ID="${id}">([\\s\\S]*?)<\\/Valute>`, "i"));
  if (!match) return null;

  const block = match[1];
  const nominal = toNumber(parseXmlTag(block, "Nominal"), 1) || 1;
  const value = toNumber(parseXmlTag(block, "Value"), 0);

  if (!value) return null;

  return {
    nominal,
    value,
    perOne: value / nominal,
  };
}

function parseCbrDate(xml: string) {
  return xml.match(/<ValCurs[^>]*Date="([^"]+)"/i)?.[1] || "";
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "MosaicAuto calculator",
      accept: "text/xml,text/plain,*/*",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  return response.text();
}

async function loadCurrency(): Promise<RubCurrency> {
  try {
    const xml = await fetchText("https://www.cbr.ru/scripts/XML_daily.asp");

    const usd = parseCbrValue(xml, "R01235");
    const eur = parseCbrValue(xml, "R01239");
    const jpy = parseCbrValue(xml, "R01820");

    const usdRub = usd?.perOne || 88;
    const jpyPerOne = jpy?.perOne || 0.48;

    return {
      date: parseCbrDate(xml),
      usd: usd?.value || usdRub,
      eur: eur?.value || 95,
      jpy: jpy?.value || 48,
      jpyPerOne,
      jpy2usd: usdRub && jpyPerOne ? usdRub / jpyPerOne : 161.83,
      source: "CBR РФ",
    };
  } catch {
    return {
      date: "",
      usd: 88,
      eur: 95,
      jpy: 48,
      jpyPerOne: 0.48,
      jpy2usd: 161.83,
      source: "fallback",
    };
  }
}

function calcFuel(body: Record<string, unknown>): FuelCode {
  const raw = String(body.fuel ?? "").toLowerCase();

  if (raw.includes("диз") || raw.includes("diesel") || raw === "1") return 1;
  if (raw.includes("элект") || raw.includes("electric") || raw === "3") return 3;
  if (raw.includes("гиб") || raw.includes("hybrid") || raw === "4") return 4;

  const numeric = Math.round(toNumber(body.fuel, 2));
  if ([1, 2, 3, 4, 5].includes(numeric)) return numeric as FuelCode;

  return 2;
}

function calcPassing(body: Record<string, unknown>) {
  return body.isProhChecked || body.passing === 1 || body.passing === "1" ? 1 : 0;
}

function parseCalcosXml(xml: string): CalcosResult {
  const usdRub = toNumber(parseXmlTag(xml, "usd"), 88);
  const eurRub = toNumber(parseXmlTag(xml, "eur"), 95);
  const jpyRub = toNumber(parseXmlTag(xml, "jpy"), 48);

  return {
    sum: toNumber(parseXmlTag(xml, "sum"), 0),
    fiz: toNumber(parseXmlTag(xml, "fiz"), 0),
    jur: toNumber(parseXmlTag(xml, "jur"), 0),
    fizInfo: parseXmlTag(xml, "fiz_info"),
    jurInfo: parseXmlTag(xml, "jur_info"),
    taxModeResult: parseXmlTag(xml, "tax_mode"),
    rates: {
      usdRub,
      eurRub,
      jpyRub,
    },
    rawXml: xml,
  };
}

async function fetchCalcos(params: {
  priceRub: number;
  sheet1: number;
  year: number;
  passing: number;
  power: number;
  volume: number;
  fuel: FuelCode;
  taxMode: TaxMode;
}) {
  const baseUrl = process.env.CALCOS_DUTY_API_URL;

  if (!baseUrl) {
    throw new Error("CALCOS_DUTY_API_URL is empty");
  }

  const url = new URL(baseUrl);
  url.searchParams.set("verbose", "1");
  url.searchParams.set("price", String(Math.round(params.priceRub)));
  url.searchParams.set("sheet1", String(Math.round(params.sheet1)));
  url.searchParams.set("year", String(params.year));
  url.searchParams.set("passing", String(params.passing));
  url.searchParams.set("power", String(params.power));
  url.searchParams.set("volume", String(params.volume));
  url.searchParams.set("fuel", String(params.fuel));
  url.searchParams.set("tax_mode", String(params.taxMode));
  url.searchParams.set("or_change_tax_mode_to_0", "1");

  const xml = await fetchText(url.toString());
  return parseCalcosXml(xml);
}

function splitDutyInfo(info: string) {
  const nums = String(info || "")
    .match(/\d+(?:[.,]\d+)?/g)
    ?.map((x) => toNumber(x, 0))
    .filter((x) => x > 0) || [];

  return {
    dutyPart: nums[0] || 0,
    utilPart: nums[1] || 0,
  };
}

function makeRow(label: string, sourceValue: number, sourceCurrency: "JPY" | "USD" | "RUB", rub: number): CalcRow {
  return {
    label,
    sourceValue: Math.round(sourceValue || 0),
    sourceCurrency,
    rub: Math.round(rub || 0),
    formatted: fmtRub(rub),
  };
}

function makeSide(params: {
  title: string;
  calcos: CalcosResult;
  aucPrice: number;
  aucRub: number;
  sheet1: number;
  freightUsd: number;
  storageRub: number;
  brokerRub: number;
  glonassRub: number;
  currency: RubCurrency;
  taxMode: TaxMode;
}) {
  const usdRub = params.calcos.rates.usdRub || params.currency.usd || 88;
  const jpyRub = params.currency.jpyPerOne || 0.48;
  const freightRub = Math.round(params.freightUsd * usdRub);

  const dutyInfo = params.taxMode === 1 ? params.calcos.jurInfo : params.calcos.fizInfo;
  const dutyUsdTotal = params.taxMode === 1 ? params.calcos.jur : params.calcos.fiz;
  const infoSplit = splitDutyInfo(dutyInfo);

  let customsDutyRub = 0;
  let utilFeeRub = 0;

  if (infoSplit.dutyPart > 0 || infoSplit.utilPart > 0) {
    customsDutyRub = Math.round(infoSplit.dutyPart * usdRub);
    utilFeeRub = Math.round(infoSplit.utilPart * usdRub);
  } else {
    customsDutyRub = Math.round(dutyUsdTotal * usdRub);
  }

  const extraJapanRub = Math.round(params.sheet1 * jpyRub);
  const japanTotalRub = params.aucRub + extraJapanRub + freightRub;
  const customsTotalRub = customsDutyRub + utilFeeRub;
  const russiaTotalRub = customsTotalRub + params.storageRub + params.brokerRub + params.glonassRub;
  const totalRub = japanTotalRub + russiaTotalRub;

  const sectionsRub: CalcSection[] = [
    {
      title: "Расходы в Японии",
      rows: [
        makeRow("Ориентировочная стоимость авто на аукционе", params.aucPrice, "JPY", params.aucRub),
        makeRow("Ориентировочные расходы по Японии", params.sheet1, "JPY", extraJapanRub),
        makeRow("Фрахт до Владивостока", params.freightUsd, "USD", freightRub),
      ],
      totalRub: japanTotalRub,
      formattedTotal: fmtRub(japanTotalRub),
    },
    {
      title: "Расходы в России",
      rows: [
        makeRow("Таможенная пошлина", infoSplit.dutyPart, "USD", customsDutyRub),
        makeRow("Утилизационный сбор", infoSplit.utilPart, "USD", utilFeeRub),
        makeRow("Склад временного хранения", params.storageRub, "RUB", params.storageRub),
        makeRow("Таможенное оформление / брокер", params.brokerRub, "RUB", params.brokerRub),
        makeRow("ЭРА-ГЛОНАСС / оформление", params.glonassRub, "RUB", params.glonassRub),
      ],
      totalRub: russiaTotalRub,
      formattedTotal: fmtRub(russiaTotalRub),
    },
  ];

  return {
    title: params.title,
    dutyUsd: dutyUsdTotal,
    dutyInfo,
    totalRub,
    cityRub: fmtRub(totalRub),
    formattedTotal: fmtRub(totalRub),
    sectionsRub,
    text: `Ориентировочный расчёт: ${fmtRub(totalRub)}`,
    noteText: "Расчёт ориентировочный. Финальную стоимость уточнит менеджер после проверки лота.",
    source: "Ориентировочный расчёт поставщика",
    calcos: {
      taxMode: params.taxMode,
      taxModeResult: params.calcos.taxModeResult,
      fiz: params.calcos.fiz,
      jur: params.calcos.jur,
      fizInfo: params.calcos.fizInfo,
      jurInfo: params.calcos.jurInfo,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const aucPrice = Math.round(
      clamp(toNumber(body.aucPrice ?? body.price ?? body.cost ?? body.auc_price, 0), 0, 999_999_999),
    );

    const year = Math.round(
      clamp(toNumber(body.year, new Date().getFullYear()), 1900, new Date().getFullYear() + 1),
    );

    const volume = Math.round(
      clamp(toNumber(body.volume ?? body.engineVolume ?? body.engine, 0), 0, 20_000),
    );

    const power = Math.round(
      clamp(toNumber(body.power ?? body.hp ?? body.horsePower ?? body.horsepower, 0), 0, 3_000),
    );

    const fuel = calcFuel(body);
    const passing = calcPassing(body);

    if (!aucPrice || aucPrice < 1) {
      return NextResponse.json(
        { ok: false, error: "Укажи стоимость автомобиля в JPY." },
        { status: 400 },
      );
    }

    if (!year || year < 1900) {
      return NextResponse.json(
        { ok: false, error: "Укажи корректный год выпуска." },
        { status: 400 },
      );
    }

    const currency = await loadCurrency();

    const aucRub = Math.round(aucPrice * currency.jpyPerOne);

    const sheet1 = Math.round(
      clamp(toNumber(body.sheet1 ?? body.japanExpensesJpy ?? process.env.CALCOS_JAPAN_SHEET1 ?? 65_000, 65_000), 0, 100_000_000),
    );

    const freightUsd = Math.round(
      clamp(toNumber(body.freightUsd ?? body.deliveryUsd ?? process.env.CALCOS_JAPAN_FREIGHT_USD ?? 350, 350), 0, 100_000),
    );

    const storageRub = Math.round(
      clamp(toNumber(body.storageRub ?? process.env.CALCOS_JAPAN_STORAGE_RUB ?? 6000, 6000), 0, 1_000_000),
    );

    const brokerRub = Math.round(
      clamp(toNumber(body.brokerRub ?? process.env.CALCOS_JAPAN_BROKER_RUB ?? 6000, 6000), 0, 1_000_000),
    );

    const glonassRub = Math.round(
      clamp(toNumber(body.glonassRub ?? process.env.CALCOS_JAPAN_GLONASS_RUB ?? 50000, 50000), 0, 1_000_000),
    );

    const common = {
      priceRub: aucPrice,
      sheet1,
      year,
      passing,
      power,
      volume,
      fuel,
    };

    const [physicalCalc, juridicalCalc] = await Promise.all([
      fetchCalcos({ ...common, taxMode: 2 }),
      fetchCalcos({ ...common, taxMode: 1 }),
    ]);

    const physical = makeSide({
      title: "Физическое лицо",
      calcos: physicalCalc,
      aucPrice,
      aucRub,
      sheet1,
      freightUsd,
      storageRub,
      brokerRub,
      glonassRub,
      currency,
      taxMode: 2,
    });

    const juridical = makeSide({
      title: "Юридическое лицо",
      calcos: juridicalCalc,
      aucPrice,
      aucRub,
      sheet1,
      freightUsd,
      storageRub,
      brokerRub,
      glonassRub,
      currency,
      taxMode: 1,
    });

    return NextResponse.json({
      ok: true,
      source: "Ориентировочный расчёт поставщика",
      input: {
        aucPrice,
        aucRub,
        priceForCalcos: aucPrice,
        priceMode: "jpy",
        sheet1,
        freightUsd,
        storageRub,
        brokerRub,
        glonassRub,
        year,
        volume,
        power,
        fuel,
        passing,
        jpyRub: currency.jpyPerOne,
      },
      currency,
      recommendation:
        physical.totalRub > 0 && juridical.totalRub > 0 && juridical.totalRub < physical.totalRub
          ? "juridical"
          : "physical",
      physical,
      juridical,
      raw: {
        physical: physicalCalc,
        juridical: juridicalCalc,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка расчёта";
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 502 },
    );
  }
}
