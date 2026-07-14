"use client";

import { useEffect, useMemo, useState } from "react";

type AnyCar = Record<string, any>;

type Fuel = "benzine" | "diesel" | "electro" | "benzineHybrid" | "dieselHybrid";

type RubRow = {
  label: string;
  formatted: string;
  rub: number;
};

type RubSection = {
  title: string;
  rows: RubRow[];
  formattedTotal: string;
  totalRub: number;
};

type CalcSide = {
  title: string;
  total: string;
  totalNum: number;
  sectionsRub: RubSection[];
  rowsTotalNum: number;
};

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function num(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = clean(value)
    .replace(/\s+/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function fmtNumber(value: unknown) {
  const n = num(value);
  if (!n) return "—";
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

function fmtRub(value: unknown) {
  const n = num(value);
  if (!n) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ₽`;
}

function fmtYen(value: unknown) {
  const n = num(value);
  if (!n) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ¥`;
}

function pick(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text && text !== "__any__" && text !== "null" && text !== "undefined") {
      return text;
    }
  }

  return "";
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    const n = num(value);
    if (n > 0) return n;
  }

  return 0;
}

function fuelToCode(value: Fuel | string) {
  if (value === "diesel") return 1;
  if (value === "electro") return 3;
  if (value === "benzineHybrid") return 4;
  if (value === "dieselHybrid") return 5;
  return 2;
}

function safeInt(value: unknown, fallback = 0) {
  const n = num(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

function guessFuel(car: AnyCar | null): Fuel {
  const text = [
    car?.fuel,
    car?.fuelType,
    car?.fuelName,
    car?.engineType,
    car?.grade,
    car?.equipment,
    car?.complectation,
    car?.model,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();

  if (/diesel|дизел/.test(text) && /hybrid|гибрид/.test(text)) return "dieselHybrid";
  if (/hybrid|гибрид/.test(text)) return "benzineHybrid";
  if (/diesel|дизел/.test(text)) return "diesel";
  if (/ev|electric|electro|электро/.test(text)) return "electro";

  return "benzine";
}

function lotPriceJpy(car: AnyCar | null) {
  const price = pickNumber(
    car?.finishPrice,
    car?.FINISH,
    car?.priceJpy,
    car?.aucPrice,
    car?.auctionPrice,
    car?.startPrice,
    car?.START,
    car?.averagePrice,
    car?.AVG_PRICE,
    car?.price,
    car?.PRICE
  );

  if (!price) return 0;

  return Math.round(price);
}

function normalizeRubSections(raw: any): RubSection[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((section) => {
      const title = clean(section?.title);
      const rows = Array.isArray(section?.rows)
        ? section.rows
            .map((row: any) => {
              const rub = num(row?.rub);
              return {
                label: clean(row?.label),
                formatted: clean(row?.formatted) || fmtRub(rub),
                rub,
              };
            })
            .filter((row: RubRow) => row.label && row.formatted)
        : [];
      const totalRub = pickNumber(section?.totalRub, rows.reduce((sum: number, row: RubRow) => sum + row.rub, 0));

      return {
        title,
        rows,
        totalRub,
        formattedTotal: clean(section?.formattedTotal) || fmtRub(totalRub),
      };
    })
    .filter((section) => section.title && section.rows.length);
}

function buildCalcSide(side: any, fallbackTitle: string): CalcSide {
  const totalNum = pickNumber(side?.totalRub);
  const sectionsRub = normalizeRubSections(side?.sectionsRub);
  const rowsTotalNum = sectionsRub.reduce(
    (sum, section) => sum + section.rows.reduce((rowSum, row) => rowSum + row.rub, 0),
    0
  );

  return {
    title: clean(side?.title) || fallbackTitle,
    total: clean(side?.cityRub) || fmtRub(totalNum),
    totalNum,
    sectionsRub,
    rowsTotalNum,
  };
}

function CalcSideCard({
  side,
  accent,
  recommended = false,
}: {
  side: CalcSide;
  accent: "green" | "blue";
  recommended?: boolean;
}) {
  const accentClass = accent === "green" ? "text-green-700" : "text-blue-700";
  const headerClass = accent === "green" ? "bg-green-50" : "bg-blue-50";

  const diffRub = side.totalNum && side.rowsTotalNum ? Math.abs(side.totalNum - side.rowsTotalNum) : 0;

  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl border bg-white ${recommended ? "border-[#ff2d3d] shadow-[0_0_0_2px_rgba(255,45,61,0.10)]" : "border-slate-200"}`}>
      <div className={`${headerClass} border-b border-slate-100 px-4 py-4`}>
        <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          итог в городе доставки
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-lg font-black text-[#07152f]">
          <span className="min-w-0 break-words">{side.title}</span>
          {recommended ? <span className="rounded-full bg-[#ff2d3d] px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">выгоднее</span> : null}
        </div>
        <div className={`mt-2 break-words text-2xl font-black tabular-nums ${accentClass}`}>
          {side.total || "—"}
        </div>
      </div>

      {side.sectionsRub.length ? (
        <div className="divide-y divide-slate-200">
          {side.sectionsRub.map((section) => (
            <div key={section.title} className="p-4">
              <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 break-words text-sm font-black uppercase tracking-[0.08em] text-[#07152f]">
                  {section.title}
                </div>
                <div className={`min-w-0 break-words text-right text-sm font-black tabular-nums ${accentClass}`}>
                  {section.formattedTotal}
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {section.rows.map((row) => (
                  <div
                    key={`${section.title}-${row.label}`}
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(92px,140px)] gap-3 py-2 text-sm"
                  >
                    <div className="min-w-0 break-words font-bold leading-5 text-slate-600">{row.label}</div>
                    <div className="min-w-0 break-words text-right font-black tabular-nums text-[#07152f]">
                      {row.formatted}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-4 text-sm font-bold text-slate-500">
          Детализация не получена.
        </div>
      )}

      {diffRub > 2 ? (
        <div className="border-t border-yellow-100 bg-yellow-50 px-4 py-3 text-xs font-bold text-yellow-900">
          Сумма отображаемых строк отличается от общего итога на {fmtRub(diffRub)}.
        </div>
      ) : null}
    </div>
  );
}

export default function LotCalculatorPanel({ car }: { car: AnyCar | null }) {
  const lot = useMemo(() => {
    const brand = pick(car?.brand, car?.marka, car?.markaName, car?.MARKA_NAME);
    const model = pick(car?.model, car?.modelName, car?.MODEL_NAME);
    const body = pick(car?.body, car?.kuzov, car?.chassis, car?.frame, car?.KUZOV);
    const year = pick(car?.year, car?.YEAR, car?.releaseYear);
    const volume = pickNumber(car?.engineVolume, car?.volume, car?.engine, car?.ENG_V);
    const power = pickNumber(
      car?.power,
      car?.hp,
      car?.horsePower,
      car?.horsepower,
      car?.horse_power,
      car?.enginePower,
      car?.powerHp,
      car?.powerPS,
      car?.POWER,
      car?.HORSEPOWER,
      car?.HORSE_POWER,
      car?.PW,
      car?.PS
    );
    const electricPower = pickNumber(car?.electricPower, car?.electroPower, car?.PW_EL);
    const priceJpy = lotPriceJpy(car);
    const mileage = pickNumber(car?.mileage, car?.MILEAGE);
    const rate = pick(car?.rate, car?.score, car?.RATE);
    const fuel = guessFuel(car);

    return {
      brand,
      model,
      body,
      year,
      volume,
      power,
      electricPower,
      priceJpy,
      mileage,
      rate,
      fuel,
    };
  }, [car]);

  const [priceJpy, setPriceJpy] = useState(String(lot.priceJpy || ""));
  const [year, setYear] = useState(String(lot.year || ""));
  const [volume, setVolume] = useState(String(lot.volume || ""));
  const [power, setPower] = useState(String(lot.power || ""));
  const [electricPower, setElectricPower] = useState(String(lot.electricPower || ""));
  const [fuel, setFuel] = useState<Fuel>(lot.fuel);
  const [youngerThree, setYoungerThree] = useState(false);
  const [dvs30, setDvs30] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setPriceJpy(String(lot.priceJpy || ""));
    setYear(String(lot.year || ""));
    setVolume(String(lot.volume || ""));
    setPower(String(lot.power || ""));
    setElectricPower(String(lot.electricPower || ""));
    setFuel(lot.fuel);

    const releaseYear = num(lot.year);
    setYoungerThree(Boolean(releaseYear && new Date().getFullYear() - releaseYear < 3));

    setResult(null);
    setError("");
  }, [lot.priceJpy, lot.year, lot.volume, lot.power, lot.electricPower, lot.fuel]);

  async function calculate() {
    const price = safeInt(priceJpy);
    const engineVolume = safeInt(volume);
    const enginePower = safeInt(power);
    const electroPower = safeInt(electricPower);
    const releaseYear = safeInt(year);
    const fuelCodeValue = fuelToCode(fuel);

    if (!price || !releaseYear) {
      setError("Не хватает цены или года выпуска для расчёта.");
      return;
    }

    if (fuelCodeValue !== 3 && !engineVolume) {
      setError("Для расчёта AUC нужно указать объём двигателя.");
      return;
    }

    if (fuelCodeValue !== 3 && !enginePower) {
      setError("Для расчёта AUC нужно указать мощность ДВС, л.с.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/calculator/japan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          ui: "LOT_CALCULATOR_PANEL_AUC_V1",

          priceJpy: Math.round(price),
          aucPrice: Math.round(price),
          auctionPrice: Math.round(price),
          price: Math.round(price),
          cost: Math.round(price),

          year: Math.round(releaseYear),

          volume: Math.round(engineVolume),
          engineVolume: Math.round(engineVolume),
          engine: Math.round(engineVolume),

          power: Math.round(enginePower),
          hp: Math.round(enginePower),
          electricPower: Math.round(electroPower),
          electroPower: Math.round(electroPower),

          fuel: fuelCodeValue,
          fuelCode: fuelCodeValue,
          fuelType: fuel,

          isProhChecked: youngerThree,
          youngerThree,
          underThreeYears: youngerThree,

          dvs30,
          powerDvsMax30MinEd: dvs30,

          brand: lot.brand,
          model: lot.model,
          body: lot.body,
          mileage: lot.mileage,
          rate: lot.rate,
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

  useEffect(() => {
    setResult(null);
    setError("");
  }, [priceJpy, year, volume, power, electricPower, fuel, youngerThree, dvs30]);

  const physicalSide = result ? buildCalcSide(result?.physical, "Физическое лицо") : null;
  const juridicalSide = result ? buildCalcSide(result?.juridical, "Юридическое лицо") : null;

  const comparisonText =
    physicalSide && juridicalSide && physicalSide.totalNum && juridicalSide.totalNum
      ? physicalSide.totalNum <= juridicalSide.totalNum
        ? `Физическое лицо дешевле на ${fmtRub(juridicalSide.totalNum - physicalSide.totalNum)}`
        : `Юридическое лицо дешевле на ${fmtRub(physicalSide.totalNum - juridicalSide.totalNum)}`
      : "";

  const currency = result?.currency;
  const recommendedSide = physicalSide && juridicalSide && physicalSide.totalNum && juridicalSide.totalNum
    ? physicalSide.totalNum <= juridicalSide.totalNum ? "physical" : "juridical"
    : "";

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[#07152f] px-4 py-4 text-white">
        <div className="text-lg font-black">Авто калькулятор</div>
        <div className="mt-1 text-sm font-bold text-white/70">
          Реальный расчёт через AUC с данными из текущего лота
        </div>
      </div>

      <div className="grid min-w-0 gap-0 xl:grid-cols-[460px_minmax(0,1fr)] lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className="min-w-0 border-b border-slate-100 p-5 lg:border-b-0 lg:border-r">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
              текущий лот
            </div>

            <div className="mt-2 text-lg font-black text-[#07152f]">
              {[lot.brand, lot.model].filter(Boolean).join(" ") || "Автомобиль"}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white p-3">
                <div className="font-bold text-slate-400">Кузов</div>
                <div className="mt-1 font-black">{lot.body || "—"}</div>
              </div>

              <div className="rounded-xl bg-white p-3">
                <div className="font-bold text-slate-400">Оценка</div>
                <div className="mt-1 font-black">{lot.rate || "—"}</div>
              </div>

              <div className="rounded-xl bg-white p-3">
                <div className="font-bold text-slate-400">Пробег</div>
                <div className="mt-1 font-black">
                  {lot.mileage ? `${fmtNumber(lot.mileage)} км` : "—"}
                </div>
              </div>

              <div className="rounded-xl bg-white p-3">
                <div className="font-bold text-slate-400">Цена лота</div>
                <div className="mt-1 font-black text-green-700">{fmtYen(lot.priceJpy)}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid min-w-0 gap-3">
            <label className="grid min-w-0 gap-1 text-sm font-bold leading-5 text-slate-700">
              Цена авто, JPY
              <input
                value={priceJpy}
                onChange={(event) => setPriceJpy(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-black text-[#07152f] outline-none focus:border-[#ff2d3d]"
              />
            </label>

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid min-w-0 gap-1 text-sm font-bold leading-5 text-slate-700">
                Год
                <input
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-black text-[#07152f] outline-none focus:border-[#ff2d3d]"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-bold leading-5 text-slate-700">
                Объём, см³
                <input
                  value={volume}
                  onChange={(event) => setVolume(event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-black text-[#07152f] outline-none focus:border-[#ff2d3d]"
                />
              </label>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid min-w-0 gap-1 text-sm font-bold leading-5 text-slate-700">
                Мощность ДВС, л.с.
                <input
                  value={power}
                  onChange={(event) => setPower(event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-black text-[#07152f] outline-none focus:border-[#ff2d3d]"
                />
              </label>

              <label className="grid min-w-0 gap-1 text-sm font-bold leading-5 text-slate-700">
                Электро, л.с.
                <input
                  value={electricPower}
                  onChange={(event) => setElectricPower(event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-black text-[#07152f] outline-none focus:border-[#ff2d3d]"
                />
              </label>
            </div>

            <label className="grid min-w-0 gap-1 text-sm font-bold leading-5 text-slate-700">
              Тип топлива
              <select
                value={fuel}
                onChange={(event) => setFuel(event.target.value as Fuel)}
                className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 font-black text-[#07152f] outline-none focus:border-[#ff2d3d]"
              >
                <option value="benzine">Бензин</option>
                <option value="diesel">Дизель</option>
                <option value="electro">Электро</option>
                <option value="benzineHybrid">Бензин-гибрид</option>
                <option value="dieselHybrid">Дизель-гибрид</option>
              </select>
            </label>

            <div className="grid gap-2">
              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-black text-slate-700">
                <input
                  type="checkbox"
                  checked={youngerThree}
                  onChange={(event) => setYoungerThree(event.target.checked)}
                />
                моложе 3 лет
              </label>

              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-black text-slate-700">
                <input
                  type="checkbox"
                  checked={dvs30}
                  onChange={(event) => setDvs30(event.target.checked)}
                />
                мощн. ДВС max 30-мин. ЭД
              </label>
            </div>

            <button
              type="button"
              onClick={calculate}
              disabled={loading}
              className="rounded-xl bg-[#ff2d3d] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#d8001f] disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Считаю..." : "Рассчитать"}
            </button>

            {error ? (
              <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                результат
              </div>

              <div className="mt-1 text-xl font-black text-[#07152f]">
                Физическое лицо / юридическое лицо
              </div>

              {comparisonText ? (
                <div className="mt-1 text-sm font-black text-green-700">
                  {comparisonText}
                </div>
              ) : null}

              {currency ? (
                <div className="mt-1 text-xs font-bold text-slate-500">
                  Курсы AUC: USD {currency.usd || "—"} · JPY {currency.jpy || "—"} · дата {currency.date || "—"}
                </div>
              ) : null}
            </div>

            <div className="min-w-0 rounded-2xl bg-slate-50 px-4 py-3 text-right">
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                цена в расчёте
              </div>

              <div className="break-words text-lg font-black tabular-nums text-green-700">{fmtYen(priceJpy)}</div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Выполняю расчёт через AUC...
            </div>
          ) : !result ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Данные из лота подставлены. Нажми «Рассчитать».
            </div>
          ) : physicalSide && juridicalSide ? (
            <div className="grid min-w-0 gap-4 2xl:grid-cols-2 xl:grid-cols-2">
              <CalcSideCard side={physicalSide} accent="green" recommended={recommendedSide === "physical"} />
              <CalcSideCard side={juridicalSide} accent="blue" recommended={recommendedSide === "juridical"} />
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Расчёт получен. Формат ответа отличается, при необходимости проверим отдельно.
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-yellow-50 p-4 text-xs font-bold leading-5 text-yellow-900">
            Расчёт ориентировочный. Источник расчёта — AUC-калькулятор.
            Итоговая стоимость зависит от курса валют, логистики, таможенных платежей
            и параметров конкретного автомобиля.
          </div>
        </div>
      </div>
    </section>
  );
}
