"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Fuel = "benzine" | "diesel" | "electro" | "benzineHybrid" | "dieselHybrid";
type Person = "physical" | "juridical";

type FormState = {
  price: string;
  year: string;
  volume: string;
  power: string;
  electroPower: string;
  fuel: Fuel;
  youngerThree: boolean;
  dvs30: boolean;
};

type CalcRow = {
  label: string;
  formatted?: string;
  rub?: number;
};

type CalcSection = {
  title: string;
  rows: CalcRow[];
  formattedTotal?: string;
  totalRub?: number;
};

type CalcSide = {
  title?: string;
  totalRub?: number;
  cityRub?: string;
  formattedTotal?: string;
  sectionsRub?: CalcSection[];
};

type CalculatorResponse = {
  ok: boolean;
  error?: string;
  currency?: {
    usd?: number;
    eur?: number;
    jpy?: number;
    cny?: number;
    date?: string;
    source?: string;
  };
  physical?: CalcSide;
  juridical?: CalcSide;
  recommendation?: Person;
};

const fuelOptions: Array<{ value: Fuel; label: string; code: number }> = [
  { value: "benzine", label: "Бензин", code: 2 },
  { value: "diesel", label: "Дизель", code: 1 },
  { value: "electro", label: "Электро", code: 3 },
  { value: "benzineHybrid", label: "Бензиновый гибрид", code: 4 },
  { value: "dieselHybrid", label: "Дизельный гибрид", code: 5 },
];

const defaultForm: FormState = {
  price: "1200000",
  year: "2024",
  volume: "1800",
  power: "120",
  electroPower: "",
  fuel: "benzine",
  youngerThree: false,
  dvs30: true,
};

function numberValue(value: unknown) {
  const parsed = Number(
    String(value ?? "")
      .replace(/\s+/g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, ""),
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(numberValue(value)));
}

function formatRub(value: unknown) {
  return `${formatNumber(value)} ₽`;
}

function formatRate(value: unknown) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(numberValue(value));
}

function cleanRub(value: unknown, fallback: unknown) {
  const text = String(value || "").trim();
  if (text) return text;
  return formatRub(fallback);
}

function Field({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-black text-slate-600">{label}</span>
      <div className="flex min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-[#ff2d3d] focus-within:ring-2 focus-within:ring-red-100">
        <input
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base font-black text-[#07152f] outline-none"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="flex shrink-0 items-center border-l border-slate-200 bg-slate-50 px-3 text-xs font-black uppercase text-slate-400">
          {unit}
        </span>
      </div>
    </label>
  );
}

function SectionCard({ section }: { section: CalcSection }) {
  const rows = Array.isArray(section.rows) ? section.rows : [];
  const total = numberValue(section.totalRub) || rows.reduce((sum, row) => sum + numberValue(row.rub), 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#07152f]">{section.title}</h3>
        <span className="text-sm font-black text-emerald-700">
          {cleanRub(section.formattedTotal, total)}
        </span>
      </div>
      <div className="divide-y divide-slate-100 px-4">
        {rows.map((row, index) => (
          <div
            key={`${section.title}-${row.label}-${index}`}
            className="grid grid-cols-[minmax(0,1fr)_minmax(110px,180px)] gap-4 py-3 text-sm"
          >
            <div className="min-w-0 break-words font-bold leading-5 text-slate-600">{row.label}</div>
            <div className="min-w-0 break-words text-right font-black tabular-nums text-[#07152f]">
              {cleanRub(row.formatted, row.rub)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SideResult({ side }: { side: CalcSide | undefined }) {
  if (!side) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-bold text-slate-500">
        Выполни расчёт, чтобы увидеть итог и детализацию.
      </div>
    );
  }

  const sections = Array.isArray(side.sectionsRub) ? side.sectionsRub : [];
  const total = numberValue(side.totalRub);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Итоговая стоимость</div>
        <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#07152f]">
          {cleanRub(side.cityRub || side.formattedTotal, total)}
        </div>
      </div>

      {sections.length ? (
        sections.map((section) => <SectionCard key={section.title} section={section} />)
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-500">
          Детализация расходов не получена.
        </div>
      )}
    </div>
  );
}

export default function JapanStandaloneCalculator() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [person, setPerson] = useState<Person>("physical");
  const [result, setResult] = useState<CalculatorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedFuel = useMemo(
    () => fuelOptions.find((option) => option.value === form.fuel) || fuelOptions[0],
    [form.fuel],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setResult(null);
    setError("");
  }

  async function calculate() {
    const price = Math.round(numberValue(form.price));
    const year = Math.round(numberValue(form.year));
    const volume = Math.round(numberValue(form.volume));
    const power = Math.round(numberValue(form.power));
    const electroPower = Math.round(numberValue(form.electroPower));

    if (!price || !year) {
      setError("Укажи стоимость автомобиля и год выпуска.");
      return;
    }

    if (selectedFuel.code !== 3 && !volume) {
      setError("Укажи объём двигателя.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/calculator/japan", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ui: "JAPAN_STANDALONE_CALCULATOR_V2",
          aucPrice: price,
          auctionPrice: price,
          priceJpy: price,
          price,
          cost: price,
          year,
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
        }),
      });

      const payload = (await response.json()) as CalculatorResponse;
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.error || `Ошибка расчёта HTTP ${response.status}`);
      }

      setResult(payload);
      setPerson(payload.recommendation === "juridical" ? "juridical" : "physical");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  }

  const activeSide = person === "physical" ? result?.physical : result?.juridical;
  const rates = result?.currency;

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link href="/" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 hover:bg-[#07152f] hover:text-white">
            На главную
          </Link>
          <div className="flex gap-2">
            <Link href="/calculator/japan" className="rounded-xl bg-[#ff2d3d] px-5 py-3 text-sm font-black text-white">
              Япония
            </Link>
            <Link href="/calculator/china" className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600">
              Китай
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1680px] gap-0 px-4 py-8 xl:grid-cols-[0.72fr_0.82fr_1.25fr] lg:px-6">
        <aside className="rounded-t-[2rem] bg-[#07152f] p-8 text-white shadow-xl shadow-slate-300/70 xl:rounded-l-[2rem] xl:rounded-r-none">
          <div className="text-sm font-black uppercase tracking-[0.35em] text-red-300">ЯПОНИЯ</div>
          <h1 className="mt-5 text-5xl font-black leading-none tracking-[-0.07em]">Калькулятор стоимости автомобиля</h1>
          <p className="mt-5 text-lg leading-8 text-white/70">
            Расчёт покупки, доставки, таможенного оформления и сопутствующих расходов через Calcos API.
          </p>
          <div className="mt-8 rounded-3xl bg-white/10 p-5 text-sm leading-7 text-white/75 ring-1 ring-white/10">
            Стоимость автомобиля вводится полной суммой в японских иенах. Результат рассчитывается отдельно для физического и юридического лица.
          </div>
        </aside>

        <section className="bg-white p-7 shadow-xl shadow-slate-300/70 ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Стоимость авто на аукционе" value={form.price} unit="JPY" onChange={(value) => update("price", value)} />
            <Field label="Год выпуска" value={form.year} unit="год" onChange={(value) => update("year", value)} />
            <Field label="Объём двигателя" value={form.volume} unit="см³" onChange={(value) => update("volume", value)} />
            <Field label="Мощность ДВС" value={form.power} unit="л.с." onChange={(value) => update("power", value)} />
            <Field label="Мощность электро" value={form.electroPower} unit="л.с." onChange={(value) => update("electroPower", value)} />
          </div>

          <div className="mt-6">
            <div className="mb-3 text-sm font-black text-slate-600">Тип топлива</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {fuelOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => update("fuel", option.value)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                    form.fuel === option.value
                      ? "border-[#ff2d3d] bg-red-50 text-[#ff2d3d]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <input type="checkbox" checked={form.youngerThree} onChange={(event) => update("youngerThree", event.target.checked)} />
              Автомобиль младше 3 лет
            </label>
            <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
              <input type="checkbox" checked={form.dvs30} onChange={(event) => update("dvs30", event.target.checked)} />
              Мощность ДВС указана как максимальная 30-минутная
            </label>
          </div>

          {error ? <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">{error}</div> : null}

          <button
            type="button"
            onClick={calculate}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-[#ff2d3d] px-5 py-4 text-base font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-red-200 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Рассчитываем…" : "Рассчитать"}
          </button>
        </section>

        <section className="rounded-b-[2rem] bg-slate-100 p-7 shadow-xl shadow-slate-300/70 ring-1 ring-slate-200 xl:rounded-l-none xl:rounded-r-[2rem]">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPerson("physical")}
              className={`rounded-xl px-4 py-3 text-sm font-black ${person === "physical" ? "bg-[#07152f] text-white" : "bg-white text-slate-600"}`}
            >
              Физическое лицо
            </button>
            <button
              type="button"
              onClick={() => setPerson("juridical")}
              className={`rounded-xl px-4 py-3 text-sm font-black ${person === "juridical" ? "bg-[#07152f] text-white" : "bg-white text-slate-600"}`}
            >
              Юридическое лицо
            </button>
          </div>

          {rates ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
              {numberValue(rates.jpy) ? <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-800">100 JPY = {formatRate(rates.jpy)} руб</span> : null}
              {numberValue(rates.usd) ? <span className="rounded-full bg-blue-100 px-3 py-2 text-blue-800">1 USD = {formatRate(rates.usd)} руб</span> : null}
              {rates.date ? <span className="rounded-full bg-white px-3 py-2 text-slate-500">Курс на {rates.date}</span> : null}
            </div>
          ) : null}

          <div className="mt-5">
            <SideResult side={activeSide} />
          </div>
        </section>
      </section>
    </main>
  );
}
