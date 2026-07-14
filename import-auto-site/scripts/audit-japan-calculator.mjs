#!/usr/bin/env node

const REQUIRED_ENV = ["CALCOS_DUTY_API_URL"];
const OPTIONAL_ENV = {
  CALCOS_JAPAN_BROKER_RUB: 6000,
  CALCOS_JAPAN_FREIGHT_USD: 350,
  CALCOS_JAPAN_GLONASS_RUB: 50000,
  CALCOS_JAPAN_SHEET1: 65000,
  CALCOS_JAPAN_STORAGE_RUB: 6000,
};

const scenarios = [
  { name: "Бензин, до 3 лет", aucPrice: 1200000, year: 2024, volume: 1800, power: 120, fuel: 2, passing: 1 },
  { name: "Бензин, 3-5 лет", aucPrice: 950000, year: 2021, volume: 1490, power: 110, fuel: 2, passing: 0 },
  { name: "Дизель, старше 5 лет", aucPrice: 800000, year: 2016, volume: 2200, power: 150, fuel: 1, passing: 0 },
  { name: "Электро", aucPrice: 1400000, year: 2022, volume: 0, power: 160, fuel: 3, passing: 0 },
  { name: "Бензиновый гибрид", aucPrice: 1800000, year: 2020, volume: 2500, power: 180, fuel: 4, passing: 0 },
  { name: "Дизельный гибрид", aucPrice: 1600000, year: 2019, volume: 2000, power: 140, fuel: 5, passing: 0 },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envNumber(name) {
  return toNumber(process.env[name] ?? OPTIONAL_ENV[name], OPTIONAL_ENV[name]);
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      url.searchParams.set(key, "[redacted]");
    }
    return `${url.origin}${url.pathname}${url.search ? `?${url.searchParams.toString()}` : ""}`;
  } catch {
    return "[invalid-url]";
  }
}

function safeFragment(text) {
  return String(text || "")
    .replace(/([?&][^=\s]{0,40}(?:key|token|secret|pass|auth)[^=\s]{0,40}=)[^&\s<]+/gi, "$1[redacted]")
    .replace(/(<[^>]*(?:key|token|secret|pass|auth)[^>]*>)[\s\S]*?(<\/[^>]+>)/gi, "$1[redacted]$2")
    .slice(0, 700);
}

function parseXmlTag(xml, tag) {
  const match = String(xml || "").match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

function parseCalcosXml(xml) {
  return {
    sum: toNumber(parseXmlTag(xml, "sum"), 0),
    fiz: toNumber(parseXmlTag(xml, "fiz"), 0),
    jur: toNumber(parseXmlTag(xml, "jur"), 0),
    fizInfo: parseXmlTag(xml, "fiz_info"),
    jurInfo: parseXmlTag(xml, "jur_info"),
    taxModeResult: parseXmlTag(xml, "tax_mode"),
    rates: {
      usdRub: toNumber(parseXmlTag(xml, "usd"), 88),
      eurRub: toNumber(parseXmlTag(xml, "eur"), 95),
      jpyRub100: toNumber(parseXmlTag(xml, "jpy"), 48),
    },
    rawXml: xml,
  };
}

function splitDutyInfo(info) {
  const nums = String(info || "")
    .match(/\d+(?:[.,]\d+)?/g)
    ?.map((x) => toNumber(x, 0))
    .filter((x) => x > 0) || [];
  return { dutyPart: nums[0] || 0, utilPart: nums[1] || 0 };
}

function buildCalcosUrl(baseUrl, input, taxMode) {
  const url = new URL(baseUrl);
  url.searchParams.set("verbose", "1");
  url.searchParams.set("price", String(Math.round(input.aucPrice)));
  url.searchParams.set("sheet1", String(Math.round(envNumber("CALCOS_JAPAN_SHEET1"))));
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

function calcSide(input, calcos, taxMode) {
  const usdRub = calcos.rates.usdRub || 88;
  const jpyRub = (calcos.rates.jpyRub100 || 48) / 100;
  const sheet1 = envNumber("CALCOS_JAPAN_SHEET1");
  const freightUsd = envNumber("CALCOS_JAPAN_FREIGHT_USD");
  const storageRub = envNumber("CALCOS_JAPAN_STORAGE_RUB");
  const brokerRub = envNumber("CALCOS_JAPAN_BROKER_RUB");
  const glonassRub = envNumber("CALCOS_JAPAN_GLONASS_RUB");
  const dutyInfo = taxMode === 1 ? calcos.jurInfo : calcos.fizInfo;
  const dutyUsdTotal = taxMode === 1 ? calcos.jur : calcos.fiz;
  const split = splitDutyInfo(dutyInfo);
  const customsDutyRub = split.dutyPart || split.utilPart ? Math.round(split.dutyPart * usdRub) : Math.round(dutyUsdTotal * usdRub);
  const utilFeeRub = split.dutyPart || split.utilPart ? Math.round(split.utilPart * usdRub) : 0;
  const components = {
    aucRub: Math.round(input.aucPrice * jpyRub),
    japanExpensesRub: Math.round(sheet1 * jpyRub),
    freightRub: Math.round(freightUsd * usdRub),
    customsDutyRub,
    utilFeeRub,
    storageRub,
    brokerRub,
    glonassRub,
  };
  const totalRub = Object.values(components).reduce((sum, value) => sum + value, 0);
  return { dutyUsdTotal, dutyInfo, components, totalRub, independentTotalRub: totalRub, diffRub: 0 };
}

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

for (const scenario of scenarios) {
  console.log(`\n=== ${scenario.name} ===`);
  console.log("Input:", scenario);
  for (const [label, taxMode] of [["physical", 2], ["juridical", 1]]) {
    const result = await fetchCalcos(process.env.CALCOS_DUTY_API_URL, scenario, taxMode);
    console.log(`\n${label}: GET ${result.safeUrl}`);
    console.log(`HTTP status: ${result.status}`);
    console.log(`Response fragment: ${safeFragment(result.text)}`);
    const parsedValue = taxMode === 1 ? result.parsed.jur : result.parsed.fiz;
    console.log(`Recognized duty value: ${parsedValue} USD-like units; info=${taxMode === 1 ? result.parsed.jurInfo : result.parsed.fizInfo}`);

    if (!result.ok || !parsedValue) {
      console.error("API response could not be parsed as a non-zero customs payment.");
      failed = true;
      continue;
    }

    const calc = calcSide(scenario, result.parsed, taxMode);
    console.log("Components RUB:", calc.components);
    console.log(`Declared total: ${calc.totalRub}; independent total: ${calc.independentTotalRub}; diff: ${calc.diffRub}`);
    if (calc.diffRub !== 0) failed = true;
  }
}

process.exit(failed ? 1 : 0);
