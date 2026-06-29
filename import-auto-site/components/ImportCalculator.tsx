"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Market = "japan" | "china";
type Fuel = "benzine" | "diesel" | "electro" | "benzineHybrid" | "dieselHybrid";
type Person = "physical" | "juridical";

type CalcForm = {
  price: string;
  year: string;
  volume: string;
  power: string;
  electroPower: string;
  fuel: Fuel;
  youngerThree: boolean;
  dvs30: boolean;
};

type ParsedSection = {
  title: string;
  columns: string[];
  rows: string[][];
};

type ParsedResult = {
  totalUsd: number;
  totalRub: number;
  cityRub: string;
  cityUsd: string;
  sections: ParsedSection[];
  rates: string[];
  notes: string[];
  text: string;
};

type CurrencyRates = {
  usd: number;
  eur: number;
  jpy: number;
  cny: number;
};

type SideResult = {
  title: string;
  parsed: ParsedResult;
};

const CALC_UI_MARKER = "CALC_UI_V4_MOSAIC_RESULT_TABLES";

const fuelOptions: Array<{ value: Fuel; label: string; code: number }> = [
  { value: "benzine", label: "Бензин", code: 2 },
  { value: "diesel", label: "Дизель", code: 1 },
  { value: "electro", label: "Электро", code: 3 },
  { value: "benzineHybrid", label: "Бензиновый гибрид", code: 4 },
  { value: "dieselHybrid", label: "Дизельный гибрид", code: 5 },
];

const defaultForm: CalcForm = {
  price: "1200",
  year: "2023",
  volume: "1800",
  power: "120",
  electroPower: "",
  fuel: "benzine",
  youngerThree: false,
  dvs30: true,
};

function n(value: unknown) {
  const parsed = Number(
    String(value ?? "")
      .replace(/\s+/g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(parsed) ? parsed : 0;
}

function fmt(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value || 0));
}

function fmtRub(value: number) {
  return value ? `${fmt(value)} руб` : "";
}

function getRates(payload: any): CurrencyRates {
  const source =
    payload?.currency ||
    payload?.rates ||
    payload?.data?.currency ||
    payload?.data?.rates ||
    payload?.result?.currency ||
    payload?.result?.rates ||
    {};

  return {
    usd: n(source?.usd || source?.USD || payload?.usd || payload?.USD) || 0,
    eur: n(source?.eur || source?.EUR || payload?.eur || payload?.EUR) || 0,
    jpy: n(source?.jpy || source?.JPY || payload?.jpy || payload?.JPY) || 0,
    cny: n(source?.cny || source?.CNY || payload?.cny || payload?.CNY) || 0,
  };
}

function moneyToRub(value: string, currency: string, rates: CurrencyRates) {
  const amount = n(value);
  const cur = String(currency || "").toUpperCase();

  if (!amount) return 0;

  if (/RUB|РУБ/.test(cur)) return amount;
  if (/USD|\$/.test(cur)) return rates.usd ? amount * rates.usd : 0;
  if (/JPY/.test(cur)) return rates.jpy ? (amount * rates.jpy) / 100 : 0;
  if (/EUR|€/.test(cur)) return rates.eur ? amount * rates.eur : 0;
  if (/CNY|YUAN|RMB/.test(cur)) return rates.cny ? amount * rates.cny : 0;

  return 0;
}

function hasCurrencyMarker(value: string) {
  return /RUB|РУБ|USD|\$|JPY|EUR|€|CNY|RMB/i.test(String(value || ""));
}

function firstExplicitRub(values: string[]) {
  const joined = values.join(" ");
  const match = joined.match(/(\d[\d\s.,]*)\s*(?:руб|RUB)/i);

  return match?.[1] || "";
}

function firstExplicitUsd(values: string[]) {
  const joined = values.join(" ");
  const match = joined.match(/(\d[\d\s.,]*)\s*(?:\$|USD)/i);

  return match?.[1] || "";
}

function lastPlainNumber(values: string[]) {
  const joined = values.join(" ");
  const matches = Array.from(
    joined.matchAll(/(^|[^\d$])(\d[\d\s.,]{1,})(?!\s*(?:\$|USD|JPY|EUR|€|CNY|RMB|руб|RUB))/gi)
  )
    .map((match) => String(match[2] || "").trim())
    .filter((value) => n(value) > 0);

  return matches.length ? matches[matches.length - 1] : "";
}

function rowToRub(
  row: string[],
  columns: string[],
  rates: CurrencyRates,
  sectionTitle: string
) {
  const label = String(row[0] || "");
  const values = row.slice(1).filter(Boolean);
  const section = String(sectionTitle || "");

  if (!values.length) return 0;

  const explicitRub = firstExplicitRub(values);
  if (explicitRub) return moneyToRub(explicitRub, "RUB", rates);

  const explicitUsd = firstExplicitUsd(values);

  /*
    В старом калькуляторе блок "Расходы в России" часто приходит нестрого:
    5235$ 403415
    где 403415 — уже рубли. Поэтому для России берем последнее число без валюты
    как рубли, а не умножаем его на доллар.
  */
  if (/России/i.test(section)) {
    const plainRub = lastPlainNumber(values);
    if (plainRub) return moneyToRub(plainRub, "RUB", rates);

    if (explicitUsd) return moneyToRub(explicitUsd, "USD", rates);

    return moneyToRub(values[values.length - 1], "RUB", rates);
  }

  /*
    В японском блоке фрахт до Владивостока обычно указан в USD.
    Если пришло просто "350", считаем это долларами, а не иенами.
  */
  if (/фрахт|владивосток|freight|C&F|CFR/i.test(label)) {
    if (explicitUsd) return moneyToRub(explicitUsd, "USD", rates);

    const plainUsd = lastPlainNumber(values) || values[values.length - 1];
    return moneyToRub(plainUsd, "USD", rates);
  }

  if (/аукционная стоимость|расходы по японии|допустимое пережатие/i.test(label)) {
    const plainJpy = lastPlainNumber(values) || values[0];
    return moneyToRub(plainJpy, "JPY", rates);
  }

  if (/^итого$/i.test(label.trim())) {
    const plainRub = lastPlainNumber(values);
    if (plainRub) return moneyToRub(plainRub, "RUB", rates);

    if (explicitUsd) return moneyToRub(explicitUsd, "USD", rates);
  }

  const rubIndex = columns.findIndex((column) => /RUB|РУБ/i.test(column));
  if (rubIndex >= 0 && values[rubIndex]) {
    return moneyToRub(values[rubIndex], "RUB", rates);
  }

  const usdIndex = columns.findIndex((column) => /USD|\$/i.test(column));
  if (usdIndex >= 0 && values[usdIndex]) {
    return moneyToRub(values[usdIndex], "USD", rates);
  }

  const jpyIndex = columns.findIndex((column) => /JPY/i.test(column));
  if (jpyIndex >= 0 && values[jpyIndex]) {
    return moneyToRub(values[jpyIndex], "JPY", rates);
  }

  const lastValue = values[values.length - 1];

  if (!hasCurrencyMarker(lastValue)) {
    return moneyToRub(lastValue, "RUB", rates);
  }

  return 0;
}

function convertSectionsToRubOnly(sections: ParsedSection[], rates: CurrencyRates) {
  return sections.map((section) => ({
    title: section.title,
    columns: ["RUB"],
    rows: section.rows.map((row) => {
      const rub = rowToRub(row, section.columns, rates, section.title);
      return [row[0] || "", rub ? fmtRub(rub) : ""];
    }),
  }));
}

function decode(value: string) {
  return String(value || "")
    .replace(/\\u003c/gi, "<")
    .replace(/\\u003e/gi, ">")
    .replace(/\\u0026/gi, "&")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function removeAucBrokenAttributes(value: string) {
  return String(value || "")
    .replace(/\s+id='[^']*'/gi, "")
    .replace(/\s+id="[^"]*"/gi, "")
    .replace(/\s+style='[^']*'/gi, "")
    .replace(/\s+style="[^"]*"/gi, "")
    .replace(/\s+href='[^']*'/gi, "")
    .replace(/\s+href="[^"]*"/gi, "")
    .replace(/\s+target='[^']*'/gi, "")
    .replace(/\s+target="[^"]*"/gi, "")
    .replace(/\s+class='[^']*'/gi, "")
    .replace(/\s+class="[^"]*"/gi, "");
}

function removeServiceHtml(value: string) {
  return decode(removeAucBrokenAttributes(value))
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ");
}

function toText(value: string) {
  return removeServiceHtml(value)
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+\|\s+/g, " | ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cellText(value: string) {
  return toText(value).replace(/\s+/g, " ").trim();
}

function tableRows(html: string) {
  const clean = removeServiceHtml(html);
  const rows: string[][] = [];

  for (const rowMatch of clean.matchAll(/<tr[\s\S]*?<\/tr>/gi)) {
    const rowHtml = rowMatch[0];

    const cells = Array.from(rowHtml.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi))
      .map((cell) => cellText(cell[1] || ""))
      .filter(Boolean);

    if (cells.length) rows.push(cells);
  }

  return rows;
}

function getString(source: any, keys: string[]) {
  for (const key of keys) {
    const value = source?.[key];

    if (typeof value === "string" && value.trim()) return value;
  }

  return "";
}

function getPayloadText(source: any, fallback: string) {
  if (typeof source === "string") return source;

  return (
    getString(source, ["html", "text", "cleanText", "result", "detail", "details", "raw", "body"]) ||
    getString(source?.result, ["html", "text"]) ||
    getString(source?.data, ["html", "text"]) ||
    fallback ||
    JSON.stringify(source || {}, null, 2)
  );
}

function extractUsd(text: string, label: string) {
  const clean = toText(text);
  const exact = clean.match(new RegExp(`${label.replace(".", "\\.")}[^\\d]*(\\d[\\d\\s]*)\\s*USD`, "i"));

  if (exact?.[1]) return n(exact[1]);

  const any = clean.match(/(\d[\d\s]*)\s*USD/i);

  return any?.[1] ? n(any[1]) : 0;
}

function parseResult(raw: string, title: string, rates: CurrencyRates): ParsedResult {
  const text = toText(raw);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  const parsed: ParsedResult = {
    totalUsd: extractUsd(raw, title),
    totalRub: 0,
    cityRub: "",
    cityUsd: "",
    sections: [],
    rates: [],
    notes: [],
    text,
  };

  const city = lines.find((line) => /ИТОГО\s+В\s+ГОРОДЕ\s+ДОСТАВКИ/i.test(line));

  if (city) {
    const rub = city.match(/ДОСТАВКИ\s*[:：]?\s*(\d[\d\s]*)\s*руб/i);
    const usd = city.match(/\((\d[\d\s]*)\s*\$?\)/i);

    if (rub?.[1]) {
      parsed.totalRub = n(rub[1]);
      parsed.cityRub = fmt(parsed.totalRub);
    }
    if (usd?.[1]) parsed.cityUsd = fmt(n(usd[1]));
  }

  for (const line of lines) {
    if (/JPY\/RUB|USD\/JPY|USD\/RUB|EUR\/RUB|10JPY/i.test(line)) {
      if (!parsed.rates.includes(line)) parsed.rates.push(line);
    }

    if (
      /Обратите внимание|страховани|Global Protection|Рекомендуем|СВХ|C&F|CFR|AS-IS/i.test(line) &&
      !/Расходы|Итого|Аукционная стоимость/i.test(line)
    ) {
      if (!parsed.notes.includes(line)) parsed.notes.push(line);
    }
  }

  const rows = tableRows(raw);
  let current: ParsedSection | null = null;

  for (const cells of rows) {
    const joined = cells.join(" ");

    if (/Расходы\s+в\s+Японии/i.test(joined)) {
      current = {
        title: "Расходы в Японии",
        columns: cells.slice(1).length ? cells.slice(1) : ["JPY", "USD", "RUB"],
        rows: [],
      };
      parsed.sections.push(current);
      continue;
    }

    if (/Расходы\s+в\s+России/i.test(joined)) {
      current = {
        title: "Расходы в России",
        columns: cells.slice(1).length ? cells.slice(1) : ["JPY", "USD", "RUB"],
        rows: [],
      };
      parsed.sections.push(current);
      continue;
    }

    if (!current) continue;
    if (/ИТОГО\s+В\s+ГОРОДЕ\s+ДОСТАВКИ/i.test(joined)) continue;
    if (/JPY\/RUB|USD\/JPY|USD\/RUB|EUR\/RUB|10JPY/i.test(joined)) continue;

    current.rows.push(cells);
  }

  parsed.sections = convertSectionsToRubOnly(
    parsed.sections.filter((section) => section.rows.length > 0),
    rates
  );

  parsed.rates = [
    rates.jpy ? `100 JPY = ${String(rates.jpy).replace(".", ",")} руб` : "",
    rates.usd ? `1 USD = ${String(rates.usd).replace(".", ",")} руб` : "",
    rates.eur ? `1 EUR = ${String(rates.eur).replace(".", ",")} руб` : "",
    rates.cny ? `1 CNY = ${String(rates.cny).replace(".", ",")} руб` : "",
  ].filter(Boolean);

  return parsed;
}


function cleanRubText(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.replace(/\s*₽\s*$/i, " руб").replace(/\s*руб\.?\s*$/i, " руб");
}

function rateBadges(rates: CurrencyRates) {
  return [
    rates.jpy ? `100 JPY = ${String(Math.round(rates.jpy * 10000) / 100).replace(".", ",")} руб` : "",
    rates.usd ? `1 USD = ${String(rates.usd).replace(".", ",")} руб` : "",
    rates.eur ? `1 EUR = ${String(rates.eur).replace(".", ",")} руб` : "",
    rates.cny ? `1 CNY = ${String(rates.cny).replace(".", ",")} руб` : "",
  ].filter(Boolean);
}

function structuredParsedResult(source: any, title: string, rates: CurrencyRates, fallbackText: string): ParsedResult | null {
  if (!source || typeof source === "string") return null;

  const sourceLines = Array.isArray(source?.lines)
    ? source.lines
    : Array.isArray(source?.items)
      ? source.items
      : Array.isArray(source?.details)
        ? source.details
        : [];

  const totalRub =
    n(source?.totalRub) ||
    n(source?.total) ||
    n(source?.cityRub) ||
    n(source?.parsed?.totalRub) ||
    0;

  const totalUsd =
    n(source?.totalUsd) ||
    n(source?.usd) ||
    n(source?.parsed?.totalUsd) ||
    0;

  if (!totalRub && !sourceLines.length) return null;

  const rows = sourceLines
    .map((line: any) => {
      const label = String(line?.label || line?.name || line?.title || line?.key || "").trim();
      const value = n(line?.value || line?.amount || line?.rub || line?.total);
      const formatted = cleanRubText(line?.formatted || line?.valueFormatted || line?.text) || (value ? `${fmt(value)} руб` : "—");

      return [label || "Расход", formatted];
    })
    .filter((row: string[]) => row[0]);

  if (totalRub) {
    rows.push(["Итого", `${fmt(totalRub)} руб`]);
  }

  const text =
    typeof source?.text === "string" && source.text.trim()
      ? source.text
      : fallbackText;

  return {
    totalUsd,
    totalRub,
    cityRub: totalRub ? fmt(totalRub) : "",
    cityUsd: totalUsd ? fmt(totalUsd) : "",
    sections: rows.length
      ? [
          {
            title: "Детализация расходов",
            columns: ["Сумма"],
            rows,
          },
        ]
      : [],
    rates: rateBadges(rates),
    notes: [
      "Расчёт ориентировочный. Итоговая стоимость зависит от курса валют, логистики, таможенных платежей и параметров конкретного автомобиля.",
    ],
    text,
  };
}

function normalizeResponse(payload: any, responseText: string) {
  const rates = getRates(payload);
  const fullText = getPayloadText(payload, responseText);

  const physicalSource =
    payload?.physical ||
    payload?.fiz ||
    payload?.fizlico ||
    payload?.individual ||
    payload?.data?.physical ||
    payload?.result?.physical ||
    fullText;

  const juridicalSource =
    payload?.juridical ||
    payload?.legal ||
    payload?.ur ||
    payload?.urlico ||
    payload?.company ||
    payload?.data?.juridical ||
    payload?.result?.juridical ||
    fullText;

  const physicalRaw = getPayloadText(physicalSource, fullText);
  const juridicalRaw = getPayloadText(juridicalSource, fullText);

  const physicalParsed =
    structuredParsedResult(physicalSource, "Физическое лицо", rates, physicalRaw) ||
    parseResult(physicalRaw, "Физическое лицо", rates);

  const juridicalParsed =
    structuredParsedResult(juridicalSource, "Юридическое лицо", rates, juridicalRaw) ||
    parseResult(juridicalRaw, "Юридическое лицо", rates);

  const physicalDutyUsd = n(physicalSource?.dutyUsd);
  const juridicalDutyUsd = n(juridicalSource?.dutyUsd);

  if (!physicalParsed.totalUsd && physicalDutyUsd) physicalParsed.totalUsd = physicalDutyUsd;
  if (!juridicalParsed.totalUsd && juridicalDutyUsd) juridicalParsed.totalUsd = juridicalDutyUsd;

  if (!physicalParsed.totalRub && physicalDutyUsd) {
    physicalParsed.totalRub = moneyToRub(String(physicalDutyUsd), "USD", rates);
    physicalParsed.cityRub = fmt(physicalParsed.totalRub);
  }

  if (!juridicalParsed.totalRub && juridicalDutyUsd) {
    juridicalParsed.totalRub = moneyToRub(String(juridicalDutyUsd), "USD", rates);
    juridicalParsed.cityRub = fmt(juridicalParsed.totalRub);
  }

  return {
    physical: {
      title: "Физическое лицо",
      parsed: physicalParsed,
    },
    juridical: {
      title: "Юридическое лицо",
      parsed: juridicalParsed,
    },
  };
}

function config(market: Market) {
  if (market === "china") {
    return {
      code: "КИТАЙ",
      title: "Китайский калькулятор",
      text: "Отдельный расчёт под Китай: стоимость CNY, логистика, таможня и оформление.",
      endpoint: "/api/calculator/china",
      priceLabel: "Стоимость авто, CNY",
      unit: "CNY",
    };
  }

  return {
    code: "ЯПОНИЯ",
    title: "Калькулятор стоимости автомобиля",
    text: "Укажите параметры автомобиля, чтобы получить ориентировочную стоимость покупки, доставки, таможенного оформления и сопутствующих расходов.",
    endpoint: "/api/calculator/japan",
    priceLabel: "Стоимость авто на аукционе",
    unit: "JPY",
  };
}


function StarShape({
  className,
  size = 10,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        background: "#ffde00",
        clipPath:
          "polygon(50% 0%, 61% 35%, 98% 35%, 68% 56%, 79% 91%, 50% 70%, 21% 91%, 32% 56%, 2% 35%, 39% 35%)",
      }}
    />
  );
}

function CountryFlag({ market }: { market: Market }) {
  if (market === "japan") {
    return (
      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-white/30">
        <div className="h-7 w-7 rounded-full bg-[#bc002d]" />
      </div>
    );
  }

  return (
    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#de2910] shadow-lg ring-1 ring-white/30">
      <StarShape className="absolute left-3 top-3" size={20} />
      <StarShape className="absolute left-10 top-2 rotate-[22deg]" size={8} />
      <StarShape className="absolute left-12 top-5 rotate-[-12deg]" size={8} />
      <StarShape className="absolute left-10 top-8 rotate-[18deg]" size={8} />
      <StarShape className="absolute left-7 top-10 rotate-[-18deg]" size={8} />
    </div>
  );
}

function CountryIntro({ market, code }: { market: Market; code: string }) {
  return (
    <div className="flex items-center gap-4">
      <CountryFlag market={market} />

      <div>
        <div className="text-sm font-black uppercase tracking-[0.35em] text-red-300">
          {code}
        </div>

        <div className="mt-1 text-xs font-bold text-white/55">
          {market === "japan"
            ? "Японские аукционы · расчёт в рублях"
            : "Автомобили из Китая · расчёт в рублях"}
        </div>
      </div>
    </div>
  );
}


function Field(props: {
  label: string;
  value: string;
  unit?: string;
  wide?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={props.wide ? "col-span-2 block" : "block"}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-slate-600">{props.label}</span>
      <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <input
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          inputMode="numeric"
          className="min-w-0 flex-1 px-4 py-3.5 text-base font-bold outline-none"
        />
        {props.unit ? (
          <span className="flex min-w-[64px] items-center justify-center bg-slate-50 px-3 text-xs font-black text-slate-400">
            {props.unit}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function TotalButton(props: {
  side: SideResult;
  active: boolean;
  onClick: () => void;
}) {
  const value = props.side.parsed.totalRub;

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`w-full rounded-3xl p-5 text-left transition ${
        props.active
          ? "bg-[#ff2d3d] text-white shadow-xl shadow-red-500/25"
          : "bg-white text-[#07152f] hover:bg-slate-50"
      }`}
    >
      <div className={`text-sm font-black ${props.active ? "text-white/75" : "text-slate-500"}`}>
        {props.side.title}
      </div>
      <div className="mt-2 text-3xl font-black tracking-[0.08em]">
        {value ? `${fmt(value)} руб` : "—"}
      </div>
    </button>
  );
}


function CountryVisualStrip({ market }: { market: Market }) {
  const isJapan = market === "japan";

  const data = isJapan
    ? {
        flag: "🇯🇵",
        country: "Япония",
        sub: "Японские аукционы и расчёт стоимости",
        chips: ["JPY", "Аукционы", "Импорт из Японии"],
        boxClass:
          "border-white/10 bg-white/5 text-white",
        chipClass:
          "border border-white/10 bg-white/10 text-white/85",
        iconClass:
          "bg-white/10 ring-1 ring-white/10",
      }
    : {
        flag: "🇨🇳",
        country: "Китай",
        sub: "Автомобили из Китая и отдельный расчёт",
        chips: ["CNY", "Китай", "Импорт авто"],
        boxClass:
          "border-white/10 bg-white/5 text-white",
        chipClass:
          "border border-white/10 bg-white/10 text-white/85",
        iconClass:
          "bg-white/10 ring-1 ring-white/10",
      };

  return (
    <div className={`mt-5 rounded-3xl border p-4 ${data.boxClass}`}>
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm ${data.iconClass}`}
        >
          {data.flag}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-black uppercase tracking-[0.18em]">
            {data.country}
          </div>
          <div className="mt-1 text-xs font-semibold text-white/70">
            {data.sub}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {data.chips.map((chip) => (
          <span
            key={chip}
            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${data.chipClass}`}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}


function DetailTable({ section }: { section: ParsedSection }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
      <div className="border-b border-slate-100 px-5 py-4">
        <h4 className="text-sm font-black uppercase tracking-[0.22em] text-[#ff2d3d]">
          {section.title}
        </h4>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              <th className="w-[48%] px-5 py-3">Статья</th>
              {section.columns.map((column, index) => (
                <th key={`${column}-${index}`} className="px-4 py-3 text-right">
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {section.rows.map((row, index) => {
              const isTotal = /^итого$/i.test(row[0] || "");

              return (
                <tr
                  key={`${row.join("-")}-${index}`}
                  className={`border-t border-slate-100 ${isTotal ? "bg-slate-50 font-black" : ""}`}
                >
                  <td className="px-5 py-3 leading-6 text-slate-800">{row[0]}</td>
                  {section.columns.map((_, cellIndex) => (
                    <td
                      key={`${row[0]}-${cellIndex}`}
                      className={`px-4 py-3 text-right ${isTotal ? "text-emerald-700" : "text-slate-700"}`}
                    >
                      {row[cellIndex + 1] || ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Detail({ side }: { side: SideResult }) {
  const parsed = side.parsed;

  return (
    <div className="space-y-5">
      {parsed.cityRub || parsed.cityUsd ? (
        <div className="rounded-3xl bg-white p-5 text-[#07152f] ring-1 ring-slate-200">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
            Итоговая стоимость
          </div>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            {parsed.cityRub ? (
              <div className="text-3xl font-black tracking-[-0.04em] text-emerald-700">
                {parsed.cityRub} руб
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {parsed.sections.length ? (
        parsed.sections.map((section) => (
          <DetailTable key={section.title} section={section} />
        ))
      ) : (
        <div className="rounded-3xl bg-white p-5 text-[#07152f] ring-1 ring-slate-200">
          <div className="text-sm font-black uppercase tracking-[0.22em] text-[#ff2d3d]">
            Детализация
          </div>
          <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
            {parsed.text || "Детализация появится после расчёта."}
          </pre>
        </div>
      )}

      {parsed.rates.length ? (
        <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
          <div className="text-sm font-black uppercase tracking-[0.22em] text-[#ff2d3d]">
            Курсы валют
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
            Перевод JPY, USD, EUR и CNY в рубли выполнен по текущему курсу ЦБ РФ,
            который вернул сервер расчёта на момент запроса.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {parsed.rates.map((rate, index) => (
              <span
                key={`${rate}-${index}`}
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700"
              >
                {rate}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {parsed.notes.length ? (
        <div className="rounded-3xl bg-blue-50 p-5 text-blue-950 ring-1 ring-blue-100">
          <div className="text-sm font-black uppercase tracking-[0.22em] text-blue-600">
            Примечания
          </div>
          <div className="mt-3 space-y-2 text-sm leading-6">
            {parsed.notes.map((note, index) => (
              <p key={`${note}-${index}`}>{note}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ImportCalculator(props: {
  market?: Market;
  country?: Market;
  mode?: Market;
}) {
  const market: Market = props.market || props.country || props.mode || "japan";
  const cfg = config(market);

  const [form, setForm] = useState<CalcForm>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [person, setPerson] = useState<Person>("physical");
  const [result, setResult] = useState<{
    physical: SideResult;
    juridical: SideResult;
  } | null>(null);

  const selectedFuel = useMemo(() => {
    return fuelOptions.find((item) => item.value === form.fuel) || fuelOptions[0];
  }, [form.fuel]);

  const activeSide = result
    ? person === "physical"
      ? result.physical
      : result.juridical
    : null;

  function update<K extends keyof CalcForm>(key: K, value: CalcForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function calculate() {
    setLoading(true);
    setError("");

    try {
      const price = n(form.price);
      const priceJpy = Math.round(price * 1000);
      const volume = Math.round(n(form.volume));
      const power = Math.round(n(form.power));
      const electroPower = Math.round(n(form.electroPower));

      const body = {
        ui: CALC_UI_MARKER,

        aucPrice: priceJpy,
        auctionPrice: priceJpy,
        priceJpy,
        price,
        cost: price,

        year: Math.round(n(form.year)),

        volume,
        engineVolume: volume,
        engine: volume,

        power,
        hp: power,
        electricPower: electroPower,
        electroPower,

        fuel: selectedFuel.code,
        fuelCode: selectedFuel.code,
        fuelType: form.fuel,

        isProhChecked: form.youngerThree,
        youngerThree: form.youngerThree,
        underThreeYears: form.youngerThree,

        dvs30: form.dvs30,
        powerDvsMax30MinEd: form.dvs30,
      };

      const response = await fetch(cfg.endpoint, {
        method: "POST",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await response.text();

      let payload: any = null;

      try {
        payload = JSON.parse(text);
      } catch {
        payload = { ok: response.ok, text };
      }

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || payload?.message || `Ошибка расчёта HTTP ${response.status}`);
      }

      setResult(normalizeResponse(payload, text));
      setPerson("physical");
    } catch (e) {
      setResult(null);
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      data-calculator-version={CALC_UI_MARKER}
      className="min-h-screen bg-[#f4f7fb] text-[#07152f]"
    >
      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link
            href="/"
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-[#07152f] hover:text-white"
          >
            На главную
          </Link>

          <div className="flex gap-2">
            <Link
              href="/calculator/japan"
              className={`rounded-xl px-5 py-3 text-sm font-black transition ${
                market === "japan" ? "bg-[#ff2d3d] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Япония
            </Link>
            <Link
              href="/calculator/china"
              className={`rounded-xl px-5 py-3 text-sm font-black transition ${
                market === "china" ? "bg-[#ff2d3d] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Китай
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1680px] gap-0 px-4 py-8 lg:grid-cols-[0.72fr_0.82fr_1.25fr] lg:px-6">
        <aside className="rounded-t-[2rem] bg-[#07152f] p-8 text-white shadow-xl shadow-slate-300/70 lg:rounded-l-[2rem] lg:rounded-r-none">
          <CountryIntro market={market} code={cfg.code} />

          <h1 className="mt-6 text-5xl font-black leading-none tracking-[-0.07em]">
            {cfg.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/72">
            {cfg.text}
          </p>
          <div className="mt-8 rounded-3xl bg-white/10 p-5 text-sm leading-7 text-white/72 ring-1 ring-white/10">
            После расчёта справа появится итоговая стоимость для физического и юридического лица, расходы по покупке, доставке и оформлению. Все суммы указаны в рублях. Перевод валют выполнен по текущему курсу ЦБ РФ.
          </div>
        </aside>

        <section className="bg-white p-7 shadow-xl shadow-slate-300/70 ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={cfg.priceLabel} value={form.price} unit={cfg.unit} onChange={(v) => update("price", v)} />
            <Field label="Год выпуска" value={form.year} unit="год" onChange={(v) => update("year", v)} />
            <Field label="Объём двигателя" value={form.volume} unit="см³" onChange={(v) => update("volume", v)} />
            <Field label="Мощность ДВС" value={form.power} unit="л.с." onChange={(v) => update("power", v)} />
            <Field wide label="Мощность электро" value={form.electroPower} unit="л.с." onChange={(v) => update("electroPower", v)} />
          </div>

          <div className="mt-6">
            <div className="mb-3 text-sm font-black text-slate-600">Тип топлива</div>
            <div className="grid gap-3 md:grid-cols-2">
              {fuelOptions.map((fuel) => (
                <label
                  key={fuel.value}
                  className={`flex min-h-[76px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-base font-black leading-5 tracking-[-0.02em] transition ${
                    form.fuel === fuel.value
                      ? "border-[#ff2d3d] bg-red-50 text-[#07152f]"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="fuel"
                    checked={form.fuel === fuel.value}
                    onChange={() => update("fuel", fuel.value)}
                  />
                  {fuel.label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <label className="flex min-h-[96px] cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-4 text-base font-black leading-5 tracking-[-0.02em] ring-1 ring-slate-200">
              <input
                type="checkbox"
                checked={form.youngerThree}
                onChange={(event) => update("youngerThree", event.target.checked)}
              />
              моложе 3 лет
            </label>

            <label className="flex min-h-[96px] cursor-pointer items-center gap-3 rounded-2xl bg-slate-50 p-4 text-base font-black leading-5 tracking-[-0.02em] ring-1 ring-slate-200">
              <input
                type="checkbox"
                checked={form.dvs30}
                onChange={(event) => update("dvs30", event.target.checked)}
              />
              Мощ. ДВС &gt; макс. 30-мин. ЭД
            </label>
          </div>

          <button
            type="button"
            onClick={calculate}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-[#ff2d3d] px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-100 transition hover:bg-[#07152f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Считаю..." : "Рассчитать"}
          </button>

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 ring-1 ring-red-100">
              {error}
            </div>
          ) : null}
        </section>

        <aside className="rounded-b-[2rem] bg-[#07152f] p-7 text-white shadow-xl shadow-slate-300/70 lg:rounded-l-none lg:rounded-r-[2rem]">
          <div className="text-sm font-black uppercase tracking-[0.35em] text-red-300">
            результат
          </div>

          {!result ? (
            <div className="mt-6 rounded-3xl bg-white/10 p-6 text-base leading-7 text-white/72 ring-1 ring-white/10">
              Заполните параметры автомобиля и нажмите «Рассчитать». Здесь появится итоговая стоимость и подробная разбивка расходов.
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="grid gap-4">
                <TotalButton side={result.physical} active={person === "physical"} onClick={() => setPerson("physical")} />
                <TotalButton side={result.juridical} active={person === "juridical"} onClick={() => setPerson("juridical")} />
              </div>

              {activeSide ? <Detail side={activeSide} /> : null}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
