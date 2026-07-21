import { NextRequest, NextResponse } from "next/server";
import { TextDecoder } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type CalcRow = {
  label: string;
  sourceValue: number;
  sourceCurrency: "CNY" | "USD" | "RUB";
  valueRub: number;
  formatted: string;
};

type CalcSection = {
  title: string;
  rows: CalcRow[];
  totalRub: number;
  formattedTotal: string;
};

type CalcosResult = {
  sumRub: number;
  fiz: number;
  jur: number;
  fizInfo: string;
  jurInfo: string;
  taxModeResult: string;
  rates: {
    usdRub: number;
    eurRub: number;
    jpyRub: number;
    cnyRub: number;
    krwRub: number;
  };
};

function toNumber(value: unknown, fallback = 0): number {
  const raw = String(value ?? "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .trim();

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function fmtRub(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value || 0))} ₽`;
}

function xmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

function parseRate(currencyText: string, key: string): number {
  const match = currencyText.match(new RegExp(`${key}:([0-9.,]+)`, "i"));
  return toNumber(match?.[1], 0);
}

function parseCalcosXml(xml: string): CalcosResult {
  const sumRub = toNumber(xmlTag(xml, "sum"), 0);
  const currencyText = xmlTag(xml, "currency");

  if (!sumRub) {
    throw new Error(`Calcos returned empty sum: ${xml.slice(0, 240)}`);
  }

  return {
    sumRub,
    fiz: toNumber(xmlTag(xml, "fiz"), 0),
    jur: toNumber(xmlTag(xml, "jur"), 0),
    fizInfo: xmlTag(xml, "fiz_info"),
    jurInfo: xmlTag(xml, "jur_info"),
    taxModeResult: xmlTag(xml, "tax_mode"),
    rates: {
      usdRub: parseRate(currencyText, "USDRUB_system"),
      eurRub: parseRate(currencyText, "EURRUB_system"),
      jpyRub: parseRate(currencyText, "JPYRUB_system"),
      cnyRub: parseRate(currencyText, "CNYRUB_system"),
      krwRub: parseRate(currencyText, "KRWRUB_system"),
    },
  };
}

async function fetchWin1251(url: string): Promise<string> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": "Mozilla/5.0 MosaicAuto Calcos calculator",
      accept: "application/xml,text/xml,text/plain,*/*",
    },
  });

  const buffer = await response.arrayBuffer();
  const text = new TextDecoder("windows-1251").decode(buffer);

  if (!response.ok) {
    throw new Error(`Calcos HTTP ${response.status}: ${text.slice(0, 240)}`);
  }

  return text;
}

async function fetchCalcos(params: {
  price: number;
  sheet1: number;
  year: number;
  passing: number;
  power: number;
  volume: number;
  fuel: number;
  taxMode: 0 | 1 | 2;
  dvs30: number;
}): Promise<CalcosResult> {
  const baseUrl = process.env.CALCOS_DUTY_API_URL;

  if (!baseUrl) {
    throw new Error("CALCOS_DUTY_API_URL is not configured");
  }

  const url = new URL(baseUrl);
  url.searchParams.set("verbose", "1");
  url.searchParams.set("price", String(Math.round(params.price)));
  url.searchParams.set("sheet1", String(Math.round(params.sheet1)));
  url.searchParams.set("year", String(params.year));
  url.searchParams.set("passing", String(params.passing));
  url.searchParams.set("power", String(params.power));
  url.searchParams.set("volume", String(params.volume));
  url.searchParams.set("fuel", String(params.fuel));
  url.searchParams.set("tax_mode", String(params.taxMode));
  url.searchParams.set("dvs30", String(params.dvs30));
  url.searchParams.set("or_change_tax_mode_to_0", "");

  const xml = await fetchWin1251(url.toString());

  if (/not object/i.test(xml)) {
    throw new Error("Calcos returned not object");
  }

  return parseCalcosXml(xml);
}

async function loadCnyRub(): Promise<number> {
  try {
    const xml = await fetch("https://www.cbr.ru/scripts/XML_daily.asp", {
      cache: "no-store",
      headers: {
        "user-agent": "MosaicAuto CBR",
        accept: "text/xml,text/plain,*/*",
      },
    }).then((response) => response.text());

    const block = xml.match(/<Valute ID="R01375">([\s\S]*?)<\/Valute>/i)?.[1] || "";
    const nominal = toNumber(xmlTag(block, "Nominal"), 1) || 1;
    const value = toNumber(xmlTag(block, "Value"), 0);

    if (value) return value / nominal;
  } catch {
    // fallback below
  }

  return 11.3803;
}

function calcFuel(body: Record<string, unknown>): number {
  const raw = String(body.fuel ?? body.fuelType ?? "").toLowerCase();

  if (raw.includes("элект") || raw.includes("electric") || raw === "3") return 3;
  if (raw.includes("диз") || raw.includes("diesel") || raw === "1") return 1;
  if (raw.includes("гиб") || raw.includes("hybrid") || raw === "4") return 4;

  return Math.round(clamp(toNumber(body.fuel ?? 2, 2), 1, 5));
}

function calcPassing(body: Record<string, unknown>): number {
  const direct = body.passing ?? body.pasing ?? body.isPassing;

  if (direct !== undefined && direct !== null && direct !== "") {
    return Math.round(clamp(toNumber(direct, 0), 0, 1));
  }

  if (body.isProhChecked !== undefined || body.youngerThree !== undefined) {
    return body.isProhChecked || body.youngerThree ? 1 : 0;
  }

  return 0;
}

function calcDvs30(body: Record<string, unknown>): number {
  const direct = body.dvs30 ?? body.powerDvsMax30MinEd;
  if (direct === undefined || direct === null || direct === "") return 1;
  if (typeof direct === "boolean") return direct ? 1 : 0;
  return Math.round(clamp(toNumber(direct, 1), 0, 1));
}

function makeRow(
  label: string,
  sourceValue: number,
  sourceCurrency: "CNY" | "USD" | "RUB",
  valueRub: number,
): CalcRow {
  return {
    label,
    sourceValue: Math.round(sourceValue || 0),
    sourceCurrency,
    valueRub: Math.round(valueRub || 0),
    formatted: fmtRub(valueRub || 0),
  };
}

function makeSide(params: {
  title: string;
  calcos: CalcosResult;
  priceCny: number;
  chinaExpensesCny: number;
  deliveryUsd: number;
  taxMode: 0 | 1 | 2;
}) {
  const cnyRub = params.calcos.rates.cnyRub || 11.3803;
  const usdRub = params.calcos.rates.usdRub || 77.2264;
  const storageRub = 6_000;
  const brokerRub = 6_000;
  const glonassRub = 50_000;

  const carRub = Math.round(params.priceCny * cnyRub);
  const chinaExpensesRub = Math.round(params.chinaExpensesCny * cnyRub);
  const deliveryRub = Math.round(params.deliveryUsd * usdRub);

  const dutyInfo = params.taxMode === 1 ? params.calcos.jurInfo : params.calcos.fizInfo;
  const dutyUsdTotal = params.taxMode === 1 ? params.calcos.jur : params.calcos.fiz;

  // fiz/jur are the authoritative Calcos totals for customs duty plus utilization fee.
  // fiz_info/jur_info are explanatory and may omit parts of the amount.
  const customsAndUtilRub = Math.round(dutyUsdTotal * usdRub);

  const chinaTotalRub = carRub + chinaExpensesRub + deliveryRub;
  const russiaTotalRub = customsAndUtilRub + storageRub + brokerRub + glonassRub;
  const totalRub = chinaTotalRub + russiaTotalRub;

  const sectionsRub: CalcSection[] = [
    {
      title: "Расходы в Китае",
      rows: [
        makeRow("Ориентировочная стоимость авто в Китае", params.priceCny, "CNY", carRub),
        makeRow("Расходы по Китаю", params.chinaExpensesCny, "CNY", chinaExpensesRub),
        makeRow("Доставка до Владивостока", params.deliveryUsd, "USD", deliveryRub),
      ],
      totalRub: chinaTotalRub,
      formattedTotal: fmtRub(chinaTotalRub),
    },
    {
      title: "Расходы в России",
      rows: [
        makeRow(
          "Таможенная пошлина и утилизационный сбор",
          dutyUsdTotal,
          "USD",
          customsAndUtilRub,
        ),
        makeRow("Склад временного хранения", storageRub, "RUB", storageRub),
        makeRow("Таможенное оформление / брокер", brokerRub, "RUB", brokerRub),
        makeRow("ЭРА-ГЛОНАСС / оформление", glonassRub, "RUB", glonassRub),
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

    const priceCny = Math.round(
      clamp(toNumber(body.priceCny ?? body.price ?? body.cost ?? body.auc_price, 0), 0, 999_999_999),
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

    if (!priceCny) {
      return NextResponse.json({ ok: false, error: "Укажи стоимость автомобиля в CNY." }, { status: 400 });
    }

    const fuel = calcFuel(body);
    const passing = calcPassing(body);
    const dvs30 = calcDvs30(body);
    const cnyRub = await loadCnyRub();

    const chinaExpensesCny = Math.round(
      clamp(
        toNumber(body.chinaExpensesCny ?? process.env.CALCOS_CHINA_EXPENSES_CNY ?? 65_000, 65_000),
        0,
        10_000_000,
      ),
    );
    const chinaExpensesRub = Math.round(chinaExpensesCny * cnyRub);

    // The supplier calculates customs duty from the car price plus 65,000 CNY
    // of China-side expenses. Passing those expenses only as sheet1 does not
    // affect Calcos fiz/jur, so the full customs basis must be sent as price.
    const customsPriceCny = priceCny + chinaExpensesCny;
    const customsPriceRub = Math.round(customsPriceCny * cnyRub);
    const priceMode = String(process.env.CALCOS_CHINA_PRICE_MODE || "rub").toLowerCase();
    const priceForCalcos =
      priceMode === "raw" || priceMode === "cny" ? customsPriceCny : customsPriceRub;

    // China expenses are already included in priceForCalcos and are displayed
    // separately in our own sections, therefore sheet1 must not duplicate them.
    const sheet1 = Math.round(clamp(toNumber(body.sheet1, 0), 0, 10_000_000));
    const deliveryUsd = Math.round(
      clamp(toNumber(body.deliveryUsd ?? body.freightUsd ?? process.env.CALCOS_CHINA_DELIVERY_USD ?? 350, 350), 0, 100_000),
    );

    const common = {
      price: priceForCalcos,
      sheet1,
      year,
      passing,
      power,
      volume,
      fuel,
      dvs30,
    };

    const [physicalCalc, juridicalCalc] = await Promise.all([
      fetchCalcos({ ...common, taxMode: 2 }),
      fetchCalcos({ ...common, taxMode: 1 }),
    ]);

    const physical = makeSide({
      title: "Физическое лицо",
      calcos: physicalCalc,
      priceCny,
      chinaExpensesCny,
      deliveryUsd,
      taxMode: 2,
    });
    const juridical = makeSide({
      title: "Юридическое лицо",
      calcos: juridicalCalc,
      priceCny,
      chinaExpensesCny,
      deliveryUsd,
      taxMode: 1,
    });

    return NextResponse.json({
      ok: true,
      source: "Официальный калькулятор пошлины",
      checkedAt: new Date().toISOString(),
      input: {
        priceCny,
        chinaExpensesCny,
        customsPriceCny,
        customsPriceRub,
        priceForCalcos,
        priceMode,
        cnyRub,
        chinaExpensesRub,
        sheet1,
        deliveryUsd,
        year,
        volume,
        power,
        fuel,
        passing,
        dvs30,
      },
      currency: {
        source: "CBR + Calcos",
        cnyRub,
        calcos: physicalCalc.rates,
      },
      physical,
      juridical,
      raw: {
        physical: {
          sumRub: physicalCalc.sumRub,
          fiz: physicalCalc.fiz,
          jur: physicalCalc.jur,
          taxModeResult: physicalCalc.taxModeResult,
        },
        juridical: {
          sumRub: juridicalCalc.sumRub,
          fiz: juridicalCalc.fiz,
          jur: juridicalCalc.jur,
          taxModeResult: juridicalCalc.taxModeResult,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
