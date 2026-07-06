"use client";

import { useEffect, useMemo, useState } from "react";

type AnyCar = Record<string, any>;

type CalcRow = {
  label?: string;
  formatted?: string;
  value?: number;
  currency?: string;
  raw?: {
    cny?: number;
    usd?: number;
    rub?: number;
  };
};

type CalcSection = {
  title?: string;
  rows?: CalcRow[];
  total?: number;
  formattedTotal?: string;
};

type CalcSide = {
  title?: string;
  dutyUsd?: number;
  totalUsd?: number;
  totalRub?: number;
  cityRub?: number;
  formattedTotal?: string;
  sectionsRub?: CalcSection[];
};

type CalcResult = {
  ok?: boolean;
  source?: string;
  checkedAt?: string;
  currency?: {
    cnyToUsd?: number;
    source?: string;
  };
  physical?: CalcSide;
  juridical?: CalcSide;
};

function pick(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function pickNumber(...values: unknown[]): number {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;

    const num = Number(
      String(value)
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, "")
    );

    if (Number.isFinite(num) && num > 0) return num;
  }

  return 0;
}

function num(value: unknown): number {
  return pickNumber(value);
}

function fmtNumber(value: unknown): string {
  const n = pickNumber(value);
  if (!n) return "—";
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

function fmtRub(value: unknown): string {
  const n = pickNumber(value);
  if (!n) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ₽`;
}

function fmtCny(value: unknown): string {
  const n = pickNumber(value);
  if (!n) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ¥`;
}

function sideTotal(side?: CalcSide): string {
  if (!side) return "—";
  if (side.formattedTotal && side.formattedTotal !== "—") return side.formattedTotal;
  return fmtRub(side.cityRub || side.totalRub);
}

function cleanLabel(label: unknown): string {
  const text = pick(label)
    .replace(/\s+/g, " ")
    .replace(/^доставка/i, "Доставка")
    .replace(/^жд\./i, "ЖД ")
    .trim();

  return text || "Статья расходов";
}



function CalcSections({ sections }: { sections?: CalcSection[] }) {
  const visible = (sections || []).filter((section) => section?.rows?.length);

  if (!visible.length) {

  return (
      <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
        Детализация не получена.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {visible.map((section, sectionIndex) => (
        <div
          key={`${section.title || "section"}-${sectionIndex}`}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="flex items-start justify-between gap-3 bg-slate-50 px-4 py-3">
            <div className="text-sm font-black uppercase tracking-[0.08em] text-[#07152f]">
              {section.title || "Расходы"}
            </div>

            {section.formattedTotal ? (
              <div className="text-right text-sm font-black text-green-700">
                {section.formattedTotal}
              </div>
            ) : null}
          </div>

          <div className="divide-y divide-slate-100">
            {(section.rows || []).map((row, rowIndex) => (
              <div
                key={`${row.label || "row"}-${rowIndex}`}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
              >
                <div className="text-sm font-bold leading-5 text-slate-700">
                  {cleanLabel(row.label)}
                </div>

                <div className="text-sm font-black leading-5 text-[#07152f] sm:text-right">
                  {row.formatted || fmtRub(row.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalcSideCard({
  side,
  accent,
}: {
  side?: CalcSide;
  accent: "green" | "blue";
}) {
  const isGreen = accent === "green";

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={isGreen ? "bg-green-50 p-5" : "bg-blue-50 p-5"}>
        <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          итог в городе доставки
        </div>

        <div className="mt-1 text-lg font-black text-[#07152f]">
          {side?.title || (isGreen ? "Физическое лицо" : "Юридическое лицо")}
        </div>

        <div className={isGreen ? "mt-3 text-3xl font-black text-green-700" : "mt-3 text-3xl font-black text-blue-700"}>
          {sideTotal(side)}
        </div>

        {side?.totalUsd ? (
          <div className="mt-1 text-xs font-bold text-slate-500">
            Эквивалент по расчёту: {fmtNumber(side.totalUsd)} USD
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <CalcSections sections={side?.sectionsRub} />
      </div>
    </div>
  );
}

export default function ChinaLotCalculatorPanel({ car }: { car: AnyCar | null }) {
  const lot = useMemo(
    () => ({
      brand: pick(car?.brand || car?.mark || car?.manufacturer),
      model: pick(car?.model || car?.modelName),
      grade: pick(car?.grade || car?.complectation || car?.package),
      body: pick(car?.body),
      year: pickNumber(car?.year),
      volume: pickNumber(car?.engineVolume, car?.volume, car?.engine),
      power: pickNumber(car?.power, car?.horsePower, car?.hp, car?.horsepower),
      mileage: pickNumber(car?.mileage, car?.mileageKm),
      priceCny: pickNumber(car?.priceCny, car?.price, car?.cost),
    }),
    [car]
  );

  const [priceCny, setPriceCny] = useState(String(lot.priceCny || ""));
  const [year, setYear] = useState(String(lot.year || ""));
  const [volume, setVolume] = useState(String(lot.volume || ""));
  const [power, setPower] = useState(String(lot.power || ""));
  const [fuel, setFuel] = useState("benzine");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CalcResult | null>(null);

  useEffect(() => {
    setPriceCny(String(lot.priceCny || ""));
    setYear(String(lot.year || ""));
    setVolume(String(lot.volume || ""));
    setPower(String(lot.power || ""));
  }, [lot.priceCny, lot.year, lot.volume, lot.power]);

  async function calculate() {
    const price = num(priceCny);
    const releaseYear = num(year);
    const engineVolume = num(volume);
    const enginePower = num(power);

    if (!price || !releaseYear) {
      setError("Укажи цену автомобиля и год выпуска.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/calculator/china", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ui: "CHINA_LOT_CALCULATOR_PANEL_V2",
          price,
          cost: price,
          priceCny: price,
          year: releaseYear,
          volume: engineVolume,
          engineVolume,
          engine: engineVolume,
          power: enginePower,
          hp: enginePower,
          fuel,
          fuelType: fuel,
          brand: lot.brand,
          model: lot.model,
          body: lot.body,
          mileage: lot.mileage,
          grade: lot.grade,
          city: "Владивосток",
        }),
      });

      const payload = await response.json();

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || "Ошибка расчёта");
      }

      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const physical = result?.physical;
  const juridical = result?.juridical;

  // CHINA_CALCULATOR_AUTO_RUN_V2
  useEffect(() => {
    if (!priceCny || !year) return;
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceCny, year, volume, power, fuel]);


  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-[#07152f] px-5 py-4 text-white">
        <div className="text-lg font-black">Авто калькулятор</div>
        <div className="text-xs font-bold text-slate-300">
          Ориентировочный расчёт стоимости автомобиля из Китая
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="border-b border-slate-100 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              текущий лот
            </div>

            <div className="mt-2 text-base font-black text-[#07152f]">
              {lot.brand} {lot.model}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-slate-400">Комплектация</div>
                <div className="mt-1 text-[#07152f]">{lot.grade || "—"}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-slate-400">Пробег</div>
                <div className="mt-1 text-[#07152f]">{lot.mileage || "—"}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-slate-400">Объём</div>
                <div className="mt-1 text-[#07152f]">{volume || "—"} см³</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-slate-400">Ориентировочная ориентировочная цена в Китае</div>
                <div className="mt-1 text-green-700">{fmtCny(priceCny)}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-xs font-black text-slate-600">
              Цена авто, CNY
              <input
                value={priceCny}
                onChange={(event) => setPriceCny(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[#07152f] outline-none focus:border-[#ff2d3d]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs font-black text-slate-600">
                Год
                <input
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[#07152f] outline-none focus:border-[#ff2d3d]"
                />
              </label>

              <label className="grid gap-1 text-xs font-black text-slate-600">
                Объём, см³
                <input
                  value={volume}
                  onChange={(event) => setVolume(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[#07152f] outline-none focus:border-[#ff2d3d]"
                />
              </label>
            </div>

            <label className="grid gap-1 text-xs font-black text-slate-600">
              Мощность, л.с.
              <input
                value={power}
                onChange={(event) => setPower(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[#07152f] outline-none focus:border-[#ff2d3d]"
              />
            </label>

            <label className="grid gap-1 text-xs font-black text-slate-600">
              Тип топлива
              <select
                value={fuel}
                onChange={(event) => setFuel(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-[#07152f] outline-none focus:border-[#ff2d3d]"
              >
                <option value="benzine">Бензин</option>
                <option value="diesel">Дизель</option>
                <option value="electro">Электро</option>
                <option value="benzineHybrid">Бензин-гибрид</option>
                <option value="dieselHybrid">Дизель-гибрид</option>
              </select>
            </label>

            <button
              type="button"
              onClick={calculate}
              disabled={loading}
              className="rounded-xl bg-[#ff2d3d] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#d8001f] disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Считаю..." : "Пересчитать"}
            </button>

            {error ? (
              <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                результат
              </div>

              <div className="mt-1 text-xl font-black text-[#07152f]">
                Подробный расчёт стоимости
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                ориентировочная ориентировочная цена в Китае
              </div>
              <div className="text-lg font-black text-green-700">{fmtCny(priceCny)}</div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Выполняем предварительный расчёт...
            </div>
          ) : !result ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Данные из лота подставлены. Расчёт запустится автоматически, при необходимости нажми «Пересчитать».
            </div>
          ) : physical && juridical ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <CalcSideCard side={physical} accent="green" />
              <CalcSideCard side={juridical} accent="blue" />
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Расчёт получен. Формат ответа отличается.
            </div>
          )}

          <div className="mt-4 grid gap-2 rounded-2xl bg-yellow-50 p-4 text-xs font-bold leading-5 text-yellow-900">
            <p>
              Расчёт предварительный и нужен для быстрой оценки бюджета покупки автомобиля из Китая.
            </p>
            <p>
              Итоговая стоимость зависит от курса валют, параметров автомобиля, маршрута доставки,
              таможенных платежей и расходов на оформление.
            </p>
            <p>
              Перед покупкой менеджер проверит данные автомобиля и уточнит финальную стоимость.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
