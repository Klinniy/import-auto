import { NextRequest, NextResponse } from "next/server";
import { buildAggregatedSourceRows } from "@/lib/calculator/japanSections.mjs";

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

type CalcosRow = {
  tag: "tag1" | "tag2" | "tag3";
  value: number;
};

type CalcosResult = {
  sum: number;
  fiz: number;
  jur: number;
  fizInfo: string;
  jurInfo: string;
  taxModeResult: string;
  currencyRates: Partial<Record<"usdRub" | "eurRub" | "jpyRub", number>>;
  allRows: CalcosRow[];
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

function parseCurrencyString(value: string) {
  const result: Partial<Record<"usdRub" | "eurRub" | "jpyRub", number>> = {};

  for (const part of String(value || "").split(";")) {
    const [rawKey, rawValue] = part.split(":");
    if (!rawKey || rawValue == null) continue;

    const key = rawKey.trim().toUpperCase();
    const amount = toNumber(rawValue, Number.NaN);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    if (key === "USDRUB_SYSTEM" || key === "USDRUB") result.usdRub = amount;
    if (key === "EURRUB_SYSTEM" || key === "EURRUB") result.eurRub = amount;
    if (key === "JPYRUB_SYSTEM" || key === "JPYRUB") result.jpyRub = amount;
  }

  return result;
}

function parseCalcosRows(xml: string): CalcosRow[] {
  return Array.from(String(xml || "").matchAll(/<row>([\s\S]*?)<\/row>/gi)).flatMap((rowMatch) => {
    const row = rowMatch[1] || "";
    const tagMatch = row.match(/<(tag[123])>([\s\S]*?)<\/\1>/i);
    if (!tagMatch) return [];

    const tag = tagMatch[1].toLowerCase() as CalcosRow["tag"];
    const value = toNumber(tagMatch[2], Number.NaN);
    return Number.isFinite(value) ? [{ tag, value }] : [];
  });
}

function sumNumbers(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0);
}

function extractMonetaryRows(params: {
  calcos: CalcosResult;
  aucPrice: number;
  taxMode: TaxMode;
}) {
  const rows = { tag1: [] as number[], tag2: [] as number[], tag3: [] as number[] };
  let phase: "tag1" | "tag2" | "tag3" = "tag1";

  for (const row of params.calcos.allRows) {
    if (row.tag === "tag1") {
      if (phase === "tag1") {
        rows.tag1.push(row.value);
        continue;
      }
      break;
    }

    if (row.tag === "tag2") {
      if (phase === "tag3") {
        throw new Error("Calcos вернул непонятную структуру денежных строк: tag2 после tag3.");
      }
      if (!rows.tag1.length) {
        throw new Error("Calcos вернул непонятную структуру денежных строк: tag2 до tag1.");
      }
      phase = "tag2";
      rows.tag2.push(row.value);
      continue;
    }

    if (row.tag === "tag3") {
      if (!rows.tag2.length) {
        throw new Error("Calcos вернул непонятную структуру денежных строк: tag3 до tag2.");
      }
      phase = "tag3";
      rows.tag3.push(row.value);
    }
  }

  if (!rows.tag1.length || !rows.tag2.length) {
    throw new Error("Calcos вернул неполный денежный блок расчёта.");
  }

  if (Math.abs(Math.round(rows.tag1[0]) - Math.round(params.aucPrice)) > 2) {
    throw new Error("Calcos вернул денежный блок с ценой автомобиля, отличающейся от запроса.");
  }

  const expectedDuty = params.taxMode === 1 ? params.calcos.jur : params.calcos.fiz;
  if (Math.abs(sumNumbers(rows.tag2) - expectedDuty) > 2) {
    throw new Error("Calcos вернул таможенный платёж в строках, отличающийся от fiz/jur.");
  }

  return rows;
}

function resolveRates(calcos: CalcosResult, currency: RubCurrency) {
  const usdRub = calcos.currencyRates.usdRub || currency.usd || 88;
  const eurRub = calcos.currencyRates.eurRub || currency.eur || 95;
  const jpyRub = calcos.currencyRates.jpyRub || currency.jpyPerOne || 0.48;
  const sources = {
    usdRub: calcos.currencyRates.usdRub ? "calcos" : currency.source === "fallback" ? "fallback" : "CBR",
    eurRub: calcos.currencyRates.eurRub ? "calcos" : currency.source === "fallback" ? "fallback" : "CBR",
    jpyRub: calcos.currencyRates.jpyRub ? "calcos" : currency.source === "fallback" ? "fallback" : "CBR",
  };

  return {
    usdRub,
    eurRub,
    jpyRub,
    sources,
    currencySource: Object.values(sources).every((source) => source === "calcos") ? "calcos" : sources,
  };
}

function parseCbrValue(xml: string, id: string) {
  const match = xml.match(new RegExp(`<Valute ID="${id}">([\\s\\S]*?)<\\/Valute>`, "i"));
  if (!match) return null;

  const block = match[1];
  const nominal = toNumber(parseXmlTag(block, "Nominal"), 1) || 1;
  const value = toNumber(parseXmlTag(block, "Value"), 0);
  if (!value) return null;

  return { nominal, value, perOne: value / nominal };
}

function parseCbrDate(xml: string) {
  return xml.match(/<ValCurs[^>]*Date="([^"]+)"/i)?.[1] || "";
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
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
  const raw = String(body.fuel ?? body.fuelType ?? "").toLowerCase();

  if (raw.includes("диз") || raw.includes("diesel") || raw === "1") return 1;
  if (raw.includes("элект") || raw.includes("electric") || raw === "3") return 3;
  if (raw.includes("гиб") || raw.includes("hybrid") || raw === "4") return 4;

  const numeric = Math.round(toNumber(body.fuel ?? body.fuelCode, 2));
  if ([1, 2, 3, 4, 5].includes(numeric)) return numeric as FuelCode;
  return 2;
}

function calcPassing(body: Record<string, unknown>) {
  return body.isProhChecked || body.youngerThree || body.passing === 1 || body.passing === "1" ? 1 : 0;
}

function parseCalcosXml(xml: string): CalcosResult {
  return {
    sum: toNumber(parseXmlTag(xml, "sum"), 0),
    fiz: toNumber(parseXmlTag(xml, "fiz"), 0),
    jur: toNumber(parseXmlTag(xml, "jur"), 0),
    fizInfo: parseXmlTag(xml, "fiz_info"),
    jurInfo: parseXmlTag(xml, "jur_info"),
    taxModeResult: parseXmlTag(xml, "tax_mode"),
    currencyRates: parseCurrencyString(parseXmlTag(xml, "currency")),
    allRows: parseCalcosRows(xml),
  };
}

async function fetchCalcos(params: {
  priceJpy: number;
  sheet1: number;
  year: number;
  passing: number;
  power: number;
  volume: number;
  fuel: FuelCode;
  taxMode: TaxMode;
}) {
  const baseUrl = process.env.CALCOS_DUTY_API_URL;
  if (!baseUrl) throw new Error("CALCOS_DUTY_API_URL is empty");

  const url = new URL(baseUrl);
  url.searchParams.set("verbose", "1");
  url.searchParams.set("price", String(Math.round(params.priceJpy)));
  url.searchParams.set("sheet1", String(Math.round(params.sheet1)));
  url.searchParams.set("year", String(params.year));
  url.searchParams.set("passing", String(params.passing));
  url.searchParams.set("power", String(params.power));
  url.searchParams.set("volume", String(params.volume));
  url.searchParams.set("fuel", String(params.fuel));
  url.searchParams.set("tax_mode", String(params.taxMode));
  url.searchParams.set("or_change_tax_mode_to_0", "1");

  return parseCalcosXml(await fetchText(url.toString()));
}

function splitDutyInfo(info: string) {
  const nums =
    String(info || "")
      .match(/\d+(?:[.,]\d+)?/g)
      ?.map((value) => toNumber(value, 0))
      .filter((value) => value > 0) || [];

  return { dutyPart: nums[0] || 0, utilPart: nums[1] || 0 };
}

function makeRow(
  label: string,
  sourceValue: number,
  sourceCurrency: "JPY" | "USD" | "RUB",
  rub: number,
): CalcRow {
  return {
    label,
    sourceValue: Math.round(sourceValue || 0),
    sourceCurrency,
    rub: Math.round(rub || 0),
    formatted: fmtRub(rub),
  };
}

function makeSection(title: string, rows: CalcRow[]): CalcSection {
  const totalRub = rows.reduce((sum, row) => sum + row.rub, 0);
  return { title, rows, totalRub, formattedTotal: fmtRub(totalRub) };
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
  const rates = resolveRates(params.calcos, params.currency);
  const usdRub = rates.usdRub;
  const jpyRub = rates.jpyRub;
  const rowsAvailable = params.calcos.allRows.length > 0;
  const monetaryRows = rowsAvailable
    ? extractMonetaryRows({ calcos: params.calcos, aucPrice: params.aucPrice, taxMode: params.taxMode })
    : { tag1: [] as number[], tag2: [] as number[], tag3: [] as number[] };

  const dutyInfo = params.taxMode === 1 ? params.calcos.jurInfo : params.calcos.fizInfo;
  const dutyUsdTotal = params.taxMode === 1 ? params.calcos.jur : params.calcos.fiz;
  const infoSplit = splitDutyInfo(dutyInfo);
  const customsDutyUsd = infoSplit.dutyPart || dutyUsdTotal;
  const utilFeeUsd = infoSplit.utilPart;
  const customsDutyRub = Math.round(customsDutyUsd * usdRub);
  const utilFeeRub = Math.round(utilFeeUsd * usdRub);

  const reconstructedSumRub = rowsAvailable
    ? Math.round(
        sumNumbers(monetaryRows.tag1) * jpyRub +
          sumNumbers(monetaryRows.tag2) * usdRub +
          sumNumbers(monetaryRows.tag3),
      )
    : 0;
  const apiSumRub = Math.round(params.calcos.sum || 0);
  const reconstructionDiffRub = rowsAvailable ? Math.abs(reconstructedSumRub - apiSumRub) : 0;

  if (rowsAvailable && (!apiSumRub || reconstructionDiffRub > 2)) {
    throw new Error("Calcos вернул несогласованную сумму расчёта. Попробуйте позже или обратитесь к менеджеру.");
  }

  let japanRows: CalcRow[];
  let extraRussiaRows: CalcRow[];

  if (rowsAvailable) {
    const aggregated = buildAggregatedSourceRows(monetaryRows);
    japanRows = aggregated.japan.map((row) =>
      makeRow(row.label, row.sourceValue, "JPY", row.sourceValue * jpyRub),
    );
    extraRussiaRows = aggregated.russia.map((row) =>
      makeRow(row.label, row.sourceValue, "RUB", row.sourceValue),
    );
  } else {
    japanRows = [
      makeRow("Ориентировочная стоимость авто на аукционе", params.aucPrice, "JPY", params.aucRub),
      makeRow("Ориентировочные расходы по Японии", params.sheet1, "JPY", params.sheet1 * jpyRub),
      makeRow("Фрахт до Владивостока", params.freightUsd, "USD", params.freightUsd * usdRub),
    ];
    extraRussiaRows = [
      makeRow("Склад временного хранения", params.storageRub, "RUB", params.storageRub),
      makeRow("Таможенное оформление / брокер", params.brokerRub, "RUB", params.brokerRub),
      makeRow("ЭРА-ГЛОНАСС / оформление", params.glonassRub, "RUB", params.glonassRub),
    ];
  }

  const russiaRows = [
    makeRow("Таможенная пошлина", customsDutyUsd, "USD", customsDutyRub),
    makeRow("Утилизационный сбор", utilFeeUsd, "USD", utilFeeRub),
    ...extraRussiaRows,
  ];

  const rowsTotalRub = [...japanRows, ...russiaRows].reduce((sum, row) => sum + row.rub, 0);
  const totalRub = rowsAvailable ? apiSumRub : rowsTotalRub;
  const balancingDiff = totalRub - rowsTotalRub;

  if (balancingDiff) {
    const target = russiaRows[russiaRows.length - 1] || japanRows[japanRows.length - 1];
    if (target) {
      target.rub += balancingDiff;
      target.formatted = fmtRub(target.rub);
    }
  }

  const sectionsRub = [
    makeSection("Расходы в Японии", japanRows),
    makeSection("Расходы в России", russiaRows),
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
    noteText: rowsAvailable
      ? "Расчёт получен из Calcos API. Финальную стоимость уточнит менеджер после проверки лота."
      : "Fallback-расчёт без строк Calcos. Финальную стоимость уточнит менеджер после проверки лота.",
    source: rowsAvailable ? "Calcos API" : "Fallback-расчёт поставщика",
    apiSumRub,
    reconstructedSumRub: rowsAvailable ? reconstructedSumRub : totalRub,
    reconstructionDiffRub,
    currencySource: rates.currencySource,
    calculationSource: "calcos",
    usedFallback: !rowsAvailable,
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
      clamp(toNumber(body.aucPrice ?? body.priceJpy ?? body.auctionPrice ?? body.price ?? body.cost ?? body.auc_price, 0), 0, 999_999_999),
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
      return NextResponse.json({ ok: false, error: "Укажи стоимость автомобиля в JPY." }, { status: 400 });
    }
    if (!year || year < 1900) {
      return NextResponse.json({ ok: false, error: "Укажи корректный год выпуска." }, { status: 400 });
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
      clamp(toNumber(body.glonassRub ?? process.env.CALCOS_JAPAN_GLONASS_RUB ?? 50_000, 50_000), 0, 1_000_000),
    );

    const common = { priceJpy: aucPrice, sheet1, year, passing, power, volume, fuel };
    const [physicalCalc, juridicalCalc] = await Promise.all([
      fetchCalcos({ ...common, taxMode: 2 }),
      fetchCalcos({ ...common, taxMode: 1 }),
    ]);

    const commonSide = {
      aucPrice,
      aucRub,
      sheet1,
      freightUsd,
      storageRub,
      brokerRub,
      glonassRub,
      currency,
    };

    const physical = makeSide({
      ...commonSide,
      title: "Физическое лицо",
      calcos: physicalCalc,
      taxMode: 2,
    });
    const juridical = makeSide({
      ...commonSide,
      title: "Юридическое лицо",
      calcos: juridicalCalc,
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
      diagnostics: {
        physical: {
          apiSumRub: physical.apiSumRub,
          reconstructedSumRub: physical.reconstructedSumRub,
          reconstructionDiffRub: physical.reconstructionDiffRub,
          currencySource: physical.currencySource,
          calculationSource: physical.calculationSource,
          usedFallback: physical.usedFallback,
        },
        juridical: {
          apiSumRub: juridical.apiSumRub,
          reconstructedSumRub: juridical.reconstructedSumRub,
          reconstructionDiffRub: juridical.reconstructionDiffRub,
          currencySource: juridical.currencySource,
          calculationSource: juridical.calculationSource,
          usedFallback: juridical.usedFallback,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Ошибка расчёта" },
      { status: 502 },
    );
  }
}
