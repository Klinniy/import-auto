import { NextRequest, NextResponse } from "next/server";
import { TextDecoder } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CALCULATION_VERSION = "CHINA_CALCOS_PARITY_V1";

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
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function fmtRub(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(value || 0))} ₽`;
}

function xmlTag(xml: string, tag: string): string {
  return xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1]?.trim() || "";
}

function parseRate(currencyText: string, key: string): number {
  return toNumber(currencyText.match(new RegExp(`${key}:([0-9.,]+)`, "i"))?.[1], 0);
}

function parseCalcosXml(xml: string): CalcosResult {
  const sumRub = toNumber(xmlTag(xml, "sum"), 0);
  const currencyText = xmlTag(xml, "currency");
  if (!sumRub) throw new Error("Calcos вернул пустой итог");

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
  const text = new TextDecoder("windows-1251").decode(await response.arrayBuffer());
  if (!response.ok) throw new Error(`Calcos HTTP ${response.status}`);
  return text;
}

async function fetchCalcos(params: {
  priceRub: number;
  year: number;
  passing: number;
  power: number;
  volume: number;
  fuel: number;
  taxMode: 0 | 1 | 2;
  dvs30: number;
}): Promise<CalcosResult> {
  const baseUrl = process.env.CALCOS_DUTY_API_URL;
  if (!baseUrl) throw new Error("CALCOS_DUTY_API_URL is not configured");

  const url = new URL(baseUrl);
  url.searchParams.set("verbose", "1");
  url.searchParams.set("price", String(Math.round(params.priceRub)));
  url.searchParams.set("sheet1", "0");
  url.searchParams.set("year", String(params.year));
  url.searchParams.set("passing", String(params.passing));
  url.searchParams.set("pasing", String(params.passing));
  url.searchParams.set("power", String(params.power));
  url.searchParams.set("volume", String(params.volume));
  url.searchParams.set("fuel", String(params.fuel));
  url.searchParams.set("tax_mode", String(params.taxMode));
  url.searchParams.set("dvs30", String(params.dvs30));
  url.searchParams.set("or_change_tax_mode_to_0", "");

  const xml = await fetchWin1251(url.toString());
  if (/not object/i.test(xml)) throw new Error("Calcos returned not object");
  return parseCalcosXml(xml);
}

async function loadCnyRub(): Promise<number> {
  try {
    const xml = await fetch("https://www.cbr.ru/scripts/XML_daily.asp", {
      cache: "no-store",
      headers: { "user-agent": "MosaicAuto CBR", accept: "text/xml,text/plain,*/*" },
    }).then((response) => response.text());
    const block = xml.match(/<Valute ID="R01375">([\s\S]*?)<\/Valute>/i)?.[1] || "";
    const nominal = toNumber(xmlTag(block, "Nominal"), 1) || 1;
    const value = toNumber(xmlTag(block, "Value"), 0);
    if (value) return value / nominal;
  } catch {}
  return 11.3803;
}

function calcFuel(body: Record<string, unknown>): number {
  const raw = String(body.fuel ?? body.fuelType ?? "").toLowerCase();
  if (raw.includes("элект") || raw.includes("electric") || raw === "3") return 3;
  if (raw.includes("диз") || raw.includes("diesel") || raw === "1") return 1;
  if (raw.includes("гиб") || raw.includes("hybrid") || raw === "4") return 4;
  return Math.round(clamp(toNumber(body.fuel ?? 2, 2), 1, 5));
}

function calcPassing(body: Record<string, unknown>, year: number): number {
  const direct = body.passing ?? body.pasing ?? body.isPassing;
  if (direct !== undefined && direct !== null && direct !== "") {
    return Math.round(clamp(toNumber(direct, 0), 0, 1));
  }
  if (body.isProhChecked !== undefined || body.youngerThree !== undefined) {
    return body.isProhChecked || body.youngerThree ? 0 : 1;
  }
  return year >= new Date().getFullYear() - 2 ? 0 : 1;
}

function calcDvs30(body: Record<string, unknown>): number {
  const value = body.dvs30 ?? body.powerDvsMax30MinEd;
  if (value === undefined || value === null || value === "") return 1;
  if (typeof value === "boolean") return value ? 1 : 0;
  return Math.round(clamp(toNumber(value, 1), 0, 1));
}

function makeRow(label: string, sourceValue: number, sourceCurrency: "CNY" | "USD" | "RUB", valueRub: number): CalcRow {
  return { label, sourceValue: Math.round(sourceValue || 0), sourceCurrency, valueRub: Math.round(valueRub || 0), formatted: fmtRub(valueRub) };
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
  const dutyUsdTotal = params.taxMode === 1 ? params.calcos.jur : params.calcos.fiz;
  const dutyInfo = params.taxMode === 1 ? params.calcos.jurInfo : params.calcos.fizInfo;
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
        makeRow("Таможенная пошлина и утилизационный сбор", dutyUsdTotal, "USD", customsAndUtilRub),
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
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const priceCny = Math.round(clamp(toNumber(body.priceCny ?? body.price ?? body.cost ?? body.auc_price, 0), 0, 999_999_999));
    const year = Math.round(clamp(toNumber(body.year, new Date().getFullYear()), 1900, new Date().getFullYear() + 1));
    const volume = Math.round(clamp(toNumber(body.volume ?? body.engineVolume ?? body.engine, 0), 0, 20_000));
    const power = Math.round(clamp(toNumber(body.power ?? body.hp ?? body.horsePower ?? body.horsepower, 0), 0, 3_000));
    if (!priceCny) return NextResponse.json({ ok: false, error: "Укажи стоимость автомобиля в CNY." }, { status: 400 });

    const fuel = calcFuel(body);
    const passing = calcPassing(body, year);
    const dvs30 = calcDvs30(body);
    const cnyRub = await loadCnyRub();
    const chinaExpensesCny = Math.round(clamp(toNumber(body.chinaExpensesCny ?? 65_000, 65_000), 0, 10_000_000));
    const deliveryUsd = Math.round(clamp(toNumber(body.deliveryUsd ?? body.freightUsd ?? 350, 350), 0, 100_000));

    // The supplier includes China-side expenses in the customs value.
    // Calcos expects that customs value in RUB through price.
    const customsPriceCny = priceCny + chinaExpensesCny;
    const customsPriceRub = Math.round(customsPriceCny * cnyRub);

    const common = { priceRub: customsPriceRub, year, passing, power, volume, fuel, dvs30 };
    const [physicalCalc, juridicalCalc] = await Promise.all([
      fetchCalcos({ ...common, taxMode: 2 }),
      fetchCalcos({ ...common, taxMode: 1 }),
    ]);

    const physical = makeSide({ title: "Физическое лицо", calcos: physicalCalc, priceCny, chinaExpensesCny, deliveryUsd, taxMode: 2 });
    const juridical = makeSide({ title: "Юридическое лицо", calcos: juridicalCalc, priceCny, chinaExpensesCny, deliveryUsd, taxMode: 1 });

    return NextResponse.json({
      ok: true,
      calculationVersion: CALCULATION_VERSION,
      checkedAt: new Date().toISOString(),
      input: { priceCny, chinaExpensesCny, customsPriceCny, customsPriceRub, cnyRub, deliveryUsd, year, volume, power, fuel, passing, dvs30 },
      currency: { source: "CBR + Calcos", cnyRub, calcos: physicalCalc.rates },
      physical,
      juridical,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
