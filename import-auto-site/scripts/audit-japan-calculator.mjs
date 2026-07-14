#!/usr/bin/env node

export const REQUIRED_ENV = ["CALCOS_DUTY_API_URL"];
export const OPTIONAL_ENV = {
  CALCOS_JAPAN_BROKER_RUB: 6000,
  CALCOS_JAPAN_FREIGHT_USD: 350,
  CALCOS_JAPAN_GLONASS_RUB: 50000,
  CALCOS_JAPAN_SHEET1: 65000,
  CALCOS_JAPAN_STORAGE_RUB: 6000,
};

export const RECONSTRUCTION_TOLERANCE_RUB = 2;

export const scenarios = [
  { name: "Бензин, до 3 лет", aucPrice: 1200000, year: 2024, volume: 1800, power: 120, fuel: 2, passing: 1 },
  { name: "Бензин, 3-5 лет", aucPrice: 950000, year: 2021, volume: 1490, power: 110, fuel: 2, passing: 0 },
  { name: "Дизель, старше 5 лет", aucPrice: 800000, year: 2016, volume: 2200, power: 150, fuel: 1, passing: 0 },
  { name: "Электро", aucPrice: 1400000, year: 2022, volume: 0, power: 160, fuel: 3, passing: 0 },
  { name: "Бензиновый гибрид", aucPrice: 1800000, year: 2020, volume: 2500, power: 180, fuel: 4, passing: 0 },
  { name: "Дизельный гибрид", aucPrice: 1600000, year: 2019, volume: 2000, power: 140, fuel: 5, passing: 0 },
];

const CBR_URL = "https://www.cbr.ru/scripts/XML_daily.asp";
const FALLBACK_RATES = { usdRub: 88, eurRub: 95, jpyRub: 0.48 };

export function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function envNumber(name, env = process.env) {
  return toNumber(env[name] ?? OPTIONAL_ENV[name], OPTIONAL_ENV[name]);
}

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}/api/[redacted]`;
  } catch {
    return "[invalid-url]";
  }
}

export function safeFragment(text) {
  return String(text || "")
    .replace(/https?:\/\/([^\s/?#]+)(?:\/[^\s?#<]*)?/gi, "https://$1/api/[redacted]")
    .replace(/([?&][^=\s]{0,40}(?:key|token|secret|pass|auth)[^=\s]{0,40}=)[^&\s<]+/gi, "$1[redacted]")
    .replace(/(<[^>]*(?:key|token|secret|pass|auth)[^>]*>)[\s\S]*?(<\/[^>]+>)/gi, "$1[redacted]$2")
    .slice(0, 700);
}

export function parseXmlTag(xml, tag) {
  const match = String(xml || "").match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

export function parseCurrencyString(value) {
  const result = {};
  for (const part of String(value || "").split(";")) {
    const [rawKey, rawValue] = part.split(":");
    if (!rawKey || rawValue == null) continue;
    const key = rawKey.trim().toUpperCase();
    const amount = toNumber(rawValue, NaN);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (key === "USDRUB_SYSTEM" || key === "USDRUB") result.usdRub = amount;
    if (key === "EURRUB_SYSTEM" || key === "EURRUB") result.eurRub = amount;
    if (key === "JPYRUB_SYSTEM" || key === "JPYRUB") result.jpyRub = amount;
  }
  return result;
}

export function parseCalcosRows(xml) {
  return Array.from(String(xml || "").matchAll(/<row>([\s\S]*?)<\/row>/gi)).flatMap((rowMatch) => {
    const row = rowMatch[1] || "";
    const tagMatch = row.match(/<(tag[123])>([\s\S]*?)<\/\1>/i);
    if (!tagMatch) return [];
    const tag = tagMatch[1].toLowerCase();
    const value = toNumber(tagMatch[2], NaN);
    return Number.isFinite(value) ? [{ tag, value }] : [];
  });
}

export function sumNumbers(values) {
  return values.reduce((sum, value) => sum + value, 0);
}

export function extractMonetaryRows(calcos, input, taxMode) {
  const rows = { tag1: [], tag2: [], tag3: [] };
  let phase = "tag1";

  for (const row of calcos.allRows) {
    if (row.tag === "tag1") {
      if (phase === "tag1") {
        rows.tag1.push(row.value);
        continue;
      }
      break;
    }

    if (row.tag === "tag2") {
      if (phase === "tag3") throw new Error("Calcos monetary rows are unclear: tag2 after tag3.");
      if (!rows.tag1.length) throw new Error("Calcos monetary rows are unclear: tag2 before tag1.");
      phase = "tag2";
      rows.tag2.push(row.value);
      continue;
    }

    if (row.tag === "tag3") {
      if (!rows.tag2.length) throw new Error("Calcos monetary rows are unclear: tag3 before tag2.");
      phase = "tag3";
      rows.tag3.push(row.value);
    }
  }

  if (!rows.tag1.length || !rows.tag2.length) throw new Error("Calcos monetary rows are incomplete.");
  if (Math.abs(Math.round(rows.tag1[0]) - Math.round(input.aucPrice)) > 2) {
    throw new Error("Calcos first monetary tag1 differs from requested auction price.");
  }

  const expectedDuty = taxMode === 1 ? calcos.jur : calcos.fiz;
  if (Math.abs(sumNumbers(rows.tag2) - expectedDuty) > 2) {
    throw new Error("Calcos monetary tag2 differs from fiz/jur.");
  }

  return rows;
}

export function parseCalcosXml(xml) {
  const currencyRates = parseCurrencyString(parseXmlTag(xml, "currency"));
  const legacyUsd = toNumber(parseXmlTag(xml, "usd"), 0);
  const legacyEur = toNumber(parseXmlTag(xml, "eur"), 0);
  const legacyJpy100 = toNumber(parseXmlTag(xml, "jpy"), 0);

  return {
    sum: toNumber(parseXmlTag(xml, "sum"), 0),
    fiz: toNumber(parseXmlTag(xml, "fiz"), 0),
    jur: toNumber(parseXmlTag(xml, "jur"), 0),
    fizInfo: parseXmlTag(xml, "fiz_info"),
    jurInfo: parseXmlTag(xml, "jur_info"),
    taxModeResult: parseXmlTag(xml, "tax_mode"),
    currencyRaw: parseXmlTag(xml, "currency"),
    currencyRates,
    legacyRates: {
      usdRub: legacyUsd || undefined,
      eurRub: legacyEur || undefined,
      jpyRub100: legacyJpy100 || undefined,
    },
    allRows: parseCalcosRows(xml),
    rawXml: xml,
  };
}

export function splitDutyInfo(info) {
  const nums = String(info || "")
    .match(/\d+(?:[.,]\d+)?/g)
    ?.map((x) => toNumber(x, 0))
    .filter((x) => x > 0) || [];
  return { dutyPart: nums[0] || 0, utilPart: nums[1] || 0 };
}

function parseCbrValue(xml, id) {
  const match = String(xml || "").match(new RegExp(`<Valute ID="${id}">([\\s\\S]*?)<\\/Valute>`, "i"));
  if (!match) return null;
  const nominal = toNumber(parseXmlTag(match[1], "Nominal"), 1) || 1;
  const value = toNumber(parseXmlTag(match[1], "Value"), 0);
  return value ? value / nominal : null;
}

export async function loadCbrRates(fetchImpl = fetch) {
  try {
    const response = await fetchImpl(CBR_URL, {
      cache: "no-store",
      headers: { "user-agent": "MosaicAuto calculator audit", accept: "text/xml,text/plain,*/*" },
    });
    if (!response.ok) throw new Error(`CBR HTTP ${response.status}`);
    const xml = await response.text();
    const usdRub = parseCbrValue(xml, "R01235");
    const eurRub = parseCbrValue(xml, "R01239");
    const jpyRub = parseCbrValue(xml, "R01820");
    return {
      usdRub: { value: usdRub || FALLBACK_RATES.usdRub, source: usdRub ? "CBR" : "fallback" },
      eurRub: { value: eurRub || FALLBACK_RATES.eurRub, source: eurRub ? "CBR" : "fallback" },
      jpyRub: { value: jpyRub || FALLBACK_RATES.jpyRub, source: jpyRub ? "CBR" : "fallback" },
    };
  } catch {
    return {
      usdRub: { value: FALLBACK_RATES.usdRub, source: "fallback" },
      eurRub: { value: FALLBACK_RATES.eurRub, source: "fallback" },
      jpyRub: { value: FALLBACK_RATES.jpyRub, source: "fallback" },
    };
  }
}

export function buildCalcosUrl(baseUrl, input, taxMode, env = process.env) {
  const url = new URL(baseUrl);
  url.searchParams.set("verbose", "1");
  url.searchParams.set("price", String(Math.round(input.aucPrice)));
  url.searchParams.set("sheet1", String(Math.round(envNumber("CALCOS_JAPAN_SHEET1", env))));
  url.searchParams.set("year", String(input.year));
  url.searchParams.set("passing", String(input.passing));
  url.searchParams.set("power", String(input.power));
  url.searchParams.set("volume", String(input.volume));
  url.searchParams.set("fuel", String(input.fuel));
  url.searchParams.set("tax_mode", String(taxMode));
  url.searchParams.set("or_change_tax_mode_to_0", "1");
  return url;
}

async function fetchCalcos(baseUrl, input, taxMode) {
  const url = buildCalcosUrl(baseUrl, input, taxMode);
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: { "user-agent": "MosaicAuto calculator audit", accept: "text/xml,text/plain,*/*" },
  });
  const text = await response.text().catch(() => "");
  return { status: response.status, ok: response.ok, safeUrl: safeUrl(url.toString()), text, parsed: parseCalcosXml(text) };
}

function rate(value, source) {
  return { value, source };
}

export function resolveRouteEquivalentRates(calcos, cbrRates) {
  return {
    usdRub: calcos.currencyRates.usdRub ? rate(calcos.currencyRates.usdRub, "API currency") : cbrRates.usdRub,
    eurRub: calcos.currencyRates.eurRub ? rate(calcos.currencyRates.eurRub, "API currency") : cbrRates.eurRub,
    jpyRub: calcos.currencyRates.jpyRub ? rate(calcos.currencyRates.jpyRub, "API currency") : cbrRates.jpyRub,
  };
}

export function resolveCalcosCurrencyRates(calcos) {
  return {
    usdRub: calcos.currencyRates.usdRub ? rate(calcos.currencyRates.usdRub, "API currency") : null,
    eurRub: calcos.currencyRates.eurRub ? rate(calcos.currencyRates.eurRub, "API currency") : null,
    jpyRub: calcos.currencyRates.jpyRub ? rate(calcos.currencyRates.jpyRub, "API currency") : null,
  };
}

export function calculateTotals(input, calcos, taxMode, rates, env = process.env) {
  const rowsAvailable = calcos.allRows.length > 0;
  const monetaryRows = rowsAvailable ? extractMonetaryRows(calcos, input, taxMode) : { tag1: [], tag2: [], tag3: [] };
  const usdRub = rates.usdRub.value;
  const jpyRub = rates.jpyRub.value;
  const dutyInfo = taxMode === 1 ? calcos.jurInfo : calcos.fizInfo;
  const dutyUsdTotal = taxMode === 1 ? calcos.jur : calcos.fiz;
  const split = splitDutyInfo(dutyInfo);
  const tag1Jpy = sumNumbers(monetaryRows.tag1);
  const tag2Usd = sumNumbers(monetaryRows.tag2);
  const tag3Rub = sumNumbers(monetaryRows.tag3);
  const apiSumRub = Math.round(calcos.sum || 0);

  if (rowsAvailable) {
    const reconstructedSumRub = Math.round(tag1Jpy * jpyRub + tag2Usd * usdRub + tag3Rub);
    const components = {
      tag1Rub: Math.round(tag1Jpy * jpyRub),
      tag2Rub: Math.round(tag2Usd * usdRub),
      tag3Rub: Math.round(tag3Rub),
      customsDutyRub: Math.round((split.dutyPart || dutyUsdTotal) * usdRub),
      utilFeeRub: Math.round(split.utilPart * usdRub),
    };
    return {
      apiSumRub,
      dutyUsdTotal,
      dutyInfo,
      components,
      routeEquivalentTotalRub: apiSumRub,
      componentsIndependentTotalRub: reconstructedSumRub,
      reconstructedSumRub,
      reconstructionDiffRub: Math.abs(reconstructedSumRub - apiSumRub),
      diffRouteVsComponentsRub: apiSumRub - reconstructedSumRub,
      diffRouteVsApiRub: 0,
      diffComponentsVsApiRub: reconstructedSumRub - apiSumRub,
      percentRouteVsApi: 0,
      percentComponentsVsApi: apiSumRub ? ((reconstructedSumRub - apiSumRub) / apiSumRub) * 100 : null,
      usedFallback: false,
    };
  }

  const sheet1 = envNumber("CALCOS_JAPAN_SHEET1", env);
  const freightUsd = envNumber("CALCOS_JAPAN_FREIGHT_USD", env);
  const storageRub = envNumber("CALCOS_JAPAN_STORAGE_RUB", env);
  const brokerRub = envNumber("CALCOS_JAPAN_BROKER_RUB", env);
  const glonassRub = envNumber("CALCOS_JAPAN_GLONASS_RUB", env);
  const components = {
    aucRub: Math.round(input.aucPrice * jpyRub),
    japanExpensesRub: Math.round(sheet1 * jpyRub),
    freightRub: Math.round(freightUsd * usdRub),
    customsDutyRub: Math.round((split.dutyPart || dutyUsdTotal) * usdRub),
    utilFeeRub: Math.round(split.utilPart * usdRub),
    storageRub,
    brokerRub,
    glonassRub,
  };
  const fallbackTotalRub = Object.values(components).reduce((sum, value) => sum + value, 0);
  return {
    apiSumRub,
    dutyUsdTotal,
    dutyInfo,
    components,
    routeEquivalentTotalRub: fallbackTotalRub,
    componentsIndependentTotalRub: fallbackTotalRub,
    reconstructedSumRub: fallbackTotalRub,
    reconstructionDiffRub: apiSumRub ? Math.abs(fallbackTotalRub - apiSumRub) : null,
    diffRouteVsComponentsRub: 0,
    diffRouteVsApiRub: apiSumRub ? fallbackTotalRub - apiSumRub : null,
    diffComponentsVsApiRub: apiSumRub ? fallbackTotalRub - apiSumRub : null,
    percentRouteVsApi: apiSumRub ? ((fallbackTotalRub - apiSumRub) / apiSumRub) * 100 : null,
    percentComponentsVsApi: apiSumRub ? ((fallbackTotalRub - apiSumRub) / apiSumRub) * 100 : null,
    usedFallback: true,
  };
}

function assertCalcosRates(calcos) {
  const rates = resolveCalcosCurrencyRates(calcos);
  return Boolean(rates.usdRub?.value && rates.eurRub?.value && rates.jpyRub?.value);
}

function formatPercent(value) {
  return value == null ? "n/a" : `${value.toFixed(2)}%`;
}

async function main() {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length) {
    console.error(`Не хватает обязательных переменных окружения: ${missing.join(", ")}`);
    console.error("Диагностика внешнего API не запускалась. Задайте env и повторите npm run audit:calculator:japan.");
    process.exit(2);
  }

  let failed = false;
  console.log("Japan calculator audit: manual server-side diagnostic");
  console.log(`External API URL (safe): ${safeUrl(process.env.CALCOS_DUTY_API_URL)}`);
  console.log("Defaults/env components:", Object.fromEntries(Object.keys(OPTIONAL_ENV).map((name) => [name, envNumber(name)])));
  const cbrRates = await loadCbrRates();
  console.log("CBR/fallback rates:", cbrRates);

  for (const scenario of scenarios) {
    console.log(`\n=== ${scenario.name} ===`);
    console.log("Input:", scenario);
    for (const [label, taxMode] of [["physical", 2], ["juridical", 1]]) {
      const result = await fetchCalcos(process.env.CALCOS_DUTY_API_URL, scenario, taxMode);
      console.log(`\n${label}: GET ${result.safeUrl}`);
      console.log(`HTTP status: ${result.status}`);
      console.log(`Response fragment: ${safeFragment(result.text)}`);
      console.log("Parsed API currency rates:", resolveCalcosCurrencyRates(result.parsed));

      const parsedDutyValue = taxMode === 1 ? result.parsed.jur : result.parsed.fiz;
      console.log(`Recognized duty value: ${parsedDutyValue} USD-like units; info=${taxMode === 1 ? result.parsed.jurInfo : result.parsed.fizInfo}`);

      if (!result.ok) {
        console.error("API returned an error HTTP status.");
        failed = true;
        continue;
      }
      if (!result.parsed.sum) {
        console.error("API <sum> could not be parsed as a non-zero RUB amount.");
        failed = true;
        continue;
      }
      if (!assertCalcosRates(result.parsed)) {
        console.error("API <currency> could not be parsed into USD/RUB, EUR/RUB and JPY/RUB rates.");
        failed = true;
        continue;
      }
      if (!parsedDutyValue) {
        console.error("API response could not be parsed as a non-zero customs payment.");
        failed = true;
        continue;
      }

      const routeRates = resolveRouteEquivalentRates(result.parsed, cbrRates);
      const routeCalc = calculateTotals(scenario, result.parsed, taxMode, routeRates);

      console.log("Route-equivalent rate sources:", routeRates);
      console.log("Route-equivalent components RUB:", routeCalc.components);
      console.log("Route-equivalent totals:", {
        apiSumRub: routeCalc.apiSumRub,
        routeEquivalentTotalRub: routeCalc.routeEquivalentTotalRub,
        componentsIndependentTotalRub: routeCalc.componentsIndependentTotalRub,
        diffRouteVsComponentsRub: routeCalc.diffRouteVsComponentsRub,
        diffRouteVsApiRub: routeCalc.diffRouteVsApiRub,
        diffComponentsVsApiRub: routeCalc.diffComponentsVsApiRub,
        reconstructedSumRub: routeCalc.reconstructedSumRub,
        reconstructionDiffRub: routeCalc.reconstructionDiffRub,
        usedFallback: routeCalc.usedFallback,
        percentRouteVsApi: formatPercent(routeCalc.percentRouteVsApi),
        percentComponentsVsApi: formatPercent(routeCalc.percentComponentsVsApi),
      });
      if (routeCalc.diffRouteVsComponentsRub !== 0) {
        console.error("Route-equivalent total does not match independent components total.");
        failed = true;
      }
      if (!routeCalc.usedFallback && routeCalc.reconstructionDiffRub > RECONSTRUCTION_TOLERANCE_RUB) {
        console.error(`Route-equivalent reconstruction differs from API <sum> by more than ${RECONSTRUCTION_TOLERANCE_RUB} RUB.`);
        failed = true;
      }
      if (routeCalc.usedFallback) {
        console.warn("WARNING: Calcos rows are absent; route-equivalent calculation used legacy fallback components.");
      }
    }
  }

  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
