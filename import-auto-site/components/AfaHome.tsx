"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SalesStatsShort from "@/components/SalesStatsShort";

type BrandItem = {
  name: string;
  count: number;
};

type CurrencyState = {
  jpy?: number;
  date?: string;
};

const japaneseCards = [
  {
    title: "Японские автоаукционы",
    subtitle: "поиск и каталог авто",
    note: "актуальные лоты",
    icon: "jp",
    href: "/catalog",
    accent: "from-blue-700 to-slate-950",
    active: true,
  },
  {
    title: "Статистика продаж",
    subtitle: "аналитика продаж",
    note: "1 285 273 проданных авто · данные до 27.06.2026",
    icon: "📊",
    href: "/statistics",
    accent: "from-slate-800 to-slate-950",
    active: true,
  
    description: "аналитика продаж",},
  {
    title: "Авто по фикс. цене",
    subtitle: "скоро появится",
    note: "статистика по проданным лотам",
    icon: "🏷️",
    href: "/japan",
    accent: "from-amber-700 to-slate-950",
    active: false,
  },
];

const quickLinks = [
  {
    title: "Авто в наличии",
    subtitle: "перейти",
    href: "/catalog",
    icon: "🚗",
    active: true,
  },
  {
    title: "Японский калькулятор",
    subtitle: "перейти",
    href: "/calculator/japan",
    icon: "🧮",
    active: true,
  },
  {
    title: "Месяц выпуска",
    subtitle: "скоро появится",
    href: "/japan",
    icon: "🗓️",
    active: false,
  },
  {
    title: "Каталог автомобилей",
    subtitle: "перейти",
    href: "/catalog",
    icon: "📋",
    active: true,
  },
];

const steps = [
  {
    num: "1",
    title: "Выбор авто",
    text: "Марка, модель, год, пробег, оценка.",
  },
  {
    num: "2",
    title: "Проверка лота",
    text: "Фото, аукционный лист, состояние.",
  },
  {
    num: "3",
    title: "Расчет",
    text: "Стоимость покупки, доставки и оформления.",
  },
  {
    num: "4",
    title: "Сопровождение",
    text: "От ставки до получения автомобиля.",
  },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value || 0));
}

function getArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.brands)) return value.brands;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function normalizeBrands(raw: any): BrandItem[] {
  return getArray(raw)
    .map((item) => {
      const name = String(item?.name || item?.brand || item?.title || "").trim();
      const count = Number(item?.count || item?.total || item?._count || 0);

      return {
        name,
        count: Number.isFinite(count) ? count : 0,
      };
    })
    .filter((item) => item.name)
    .sort((a, b) => b.count - a.count);
}

function extractJpy(raw: any): CurrencyState {
  const jpy =
    Number(raw?.jpy) ||
    Number(raw?.JPY) ||
    Number(raw?.rates?.JPY) ||
    Number(raw?.currency?.jpy) ||
    Number(raw?.data?.jpy) ||
    0;

  return {
    jpy: Number.isFinite(jpy) ? jpy : 0,
    date: String(raw?.date || raw?.checkedAt || raw?.updatedAt || ""),
  };
}

function JapanFlag() {
  return (
    <div className="flex h-14 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-white/40">
      <div className="h-7 w-7 rounded-full bg-[#bc002d]" />
    </div>
  );
}

function CardIcon({ icon }: { icon: string }) {
  if (icon === "jp") return <JapanFlag />;

  return (
    <div className="flex h-14 w-20 items-center justify-center rounded-2xl bg-white/95 text-3xl shadow-sm ring-1 ring-white/40">
      {icon}
    </div>
  );
}


type RateHistoryPoint = {
  date: string;
  label: string;
  value: number;
  nominal?: number;
};

function formatDelta(value: number) {
  const abs = Math.abs(value).toFixed(4).replace(".", ",");

  if (value > 0) return `▲ ${abs}`;
  if (value < 0) return `▼ ${abs}`;

  return "0,0000";
}

function MiniRateChart() {
  const [points, setPoints] = useState<RateHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        const response = await fetch("/api/currency/jpy-history", {
          cache: "no-store",
        });

        const json = await response.json();

        if (!mounted) return;

        const nextPoints = Array.isArray(json?.points)
          ? json.points
              .map((point: any) => ({
                date: String(point?.date || ""),
                label: String(point?.label || point?.date || ""),
                value: Number(point?.value || 0),
                nominal: Number(point?.nominal || 100),
              }))
              .filter((point: RateHistoryPoint) => Number.isFinite(point.value) && point.value > 0)
          : [];

        setPoints(nextPoints);
      } catch {
        if (!mounted) return;
        setPoints([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const safePoints = points.slice(-14);
  const latest = safePoints.at(-1);
  const previous = safePoints.at(-2);

  const delta =
    latest && previous
      ? Number((latest.value - previous.value).toFixed(4))
      : 0;

  const values = safePoints.map((point) => point.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = max - min || 1;

  const polyline = safePoints
    .map((point, index) => {
      const x = safePoints.length <= 1 ? 60 : (index / (safePoints.length - 1)) * 116 + 2;
      const y = 31 - ((point.value - min) / range) * 28;

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isUp = delta >= 0;
  const stroke = isUp ? "#16a34a" : "#dc2626";
  const textClass = isUp ? "text-emerald-600" : "text-red-600";

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-slate-400">график</span>
        <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (!safePoints.length) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-emerald-600">актуально</span>
        <svg viewBox="0 0 120 34" className="h-9 w-24 overflow-visible" aria-hidden="true">
          <polyline
            points="2,20 118,20"
            fill="none"
            stroke="#16a34a"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2"
      title={`Реальная динамика ЦБ РФ: ${safePoints[0]?.date || ""} — ${latest?.date || ""}`}
    >
      <span className={`text-sm font-black ${textClass}`}>
        {formatDelta(delta)}
      </span>

      <svg viewBox="0 0 120 34" className="h-9 w-24 overflow-visible" aria-hidden="true">
        <polyline
          points={polyline}
          fill="none"
          stroke={stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {latest ? (
          <circle
            cx="118"
            cy={String(31 - ((latest.value - min) / range) * 28)}
            r="3.5"
            fill={stroke}
          />
        ) : null}
      </svg>
    </div>
  );
}

export default function AfaHome() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [currency, setCurrency] = useState<CurrencyState>({});
  const [tokyoTime, setTokyoTime] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [brandsResponse, currencyResponse] = await Promise.all([
          fetch("/api/brands", { cache: "no-store" }),
          fetch("/api/currency", { cache: "no-store" }),
        ]);

        const [brandsJson, currencyJson] = await Promise.all([
          brandsResponse.json().catch(() => null),
          currencyResponse.json().catch(() => null),
        ]);

        if (!mounted) return;

        setBrands(normalizeBrands(brandsJson));
        setCurrency(extractJpy(currencyJson));
      } catch {
        if (!mounted) return;
        setBrands([]);
        setCurrency({});
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function updateTokyoTime() {
      const value = new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Asia/Tokyo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());

      setTokyoTime(value.replace(",", ""));
    }

    updateTokyoTime();
    const timer = window.setInterval(updateTokyoTime, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const total = useMemo(() => {
    return brands.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [brands]);

  const topBrands = brands.slice(0, 12);
  const otherBrands = brands.slice(12, 52);

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <header className="sticky top-0 z-20 border-t-4 border-[#ff2d3d] bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black uppercase tracking-wide text-[#07152f] transition hover:bg-[#07152f] hover:text-white"
            >
              Начало
            </Link>

            <div className="hidden text-sm font-black uppercase tracking-wide text-[#07152f] md:block">
              Tokyo&nbsp; {tokyoTime || "—"}
            </div>

            <div className="hidden text-sm font-black text-blue-700 md:block">
              {total ? `${formatNumber(total)} авто из Японии` : "Авто из Японии"}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden min-w-[290px] rounded-2xl bg-slate-50 px-4 py-2 shadow-sm ring-1 ring-slate-200 lg:block">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                ЦБ РФ · 100 JPY
              </div>
              <div className="mt-1 flex items-center justify-between gap-4">
                <span className="whitespace-nowrap text-lg font-black">
                  {currency.jpy ? `${currency.jpy.toFixed(4)} ₽` : "—"}
                </span>
                <MiniRateChart />
              </div>
            </div>

            <Link
              href="/catalog"
              className="rounded-xl bg-[#07152f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff2d3d]"
            >
              Каталог
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-6 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {japaneseCards.map((card) => {
            const content = (
              <article
                className={`group min-h-[220px] rounded-[1.4rem] bg-gradient-to-br ${card.accent} p-5 text-white shadow-xl shadow-slate-300/60 transition ${
                  card.active ? "hover:-translate-y-1 hover:shadow-2xl" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <CardIcon icon={card.icon} />

                  {!card.active ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-[#07152f]">
                      скоро
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-7 text-2xl font-black uppercase leading-none tracking-[-0.04em]">
                  {card.title}
                </h2>

                <p className="mt-4 text-sm font-bold leading-6 text-white/75">
                  {card.subtitle}
                </p>

                <p className="mt-1 text-sm font-black text-white">{card.title === "Статистика продаж" ? <SalesStatsShort fallback={card.note} /> : card.note}</p>
              </article>
            );

            if (!card.active) {
              return <div key={card.title}>{content}</div>;
            }

            return (
              <Link key={card.title} href={card.href}>
                {content}
              </Link>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[1.4rem] bg-white p-5 shadow-xl shadow-slate-200/80 ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.3em] text-[#ff2d3d]">
                  японские автоаукционы
                </div>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
                  Поиск по марке
                </h1>
              </div>

              <Link
                href="/catalog"
                className="rounded-2xl bg-[#ff2d3d] px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-red-100 transition hover:bg-[#07152f]"
              >
                Открыть каталог →
              </Link>
            </div>

            {topBrands.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {topBrands.map((brand) => (
                  <Link
                    key={brand.name}
                    href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black transition hover:bg-[#07152f] hover:text-white"
                  >
                    <span>› {brand.name}</span>
                    <span className="text-slate-400">{formatNumber(brand.count)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                Марки загружаются из каталога.
              </div>
            )}

            {otherBrands.length ? (
              <div className="mt-5 grid gap-x-8 gap-y-0 md:grid-cols-2 xl:grid-cols-4">
                {otherBrands.map((brand) => (
                  <Link
                    key={brand.name}
                    href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                    className="flex items-center justify-between border-b border-slate-100 py-3 text-sm font-bold transition hover:text-[#ff2d3d]"
                  >
                    <span>› {brand.name}</span>
                    <span className="text-slate-400">{formatNumber(brand.count)}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </section>

          <aside className="rounded-[1.4rem] bg-white p-5 shadow-xl shadow-slate-200/80 ring-1 ring-slate-200">
            <div className="text-sm font-black uppercase tracking-[0.3em] text-[#ff2d3d]">
              быстрые разделы
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {quickLinks.map((item) => {
                const content = (
                  <div className="flex min-h-[92px] items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 transition hover:bg-white hover:shadow-md">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-200">
                      {item.icon}
                    </div>

                    <div>
                      <div className="text-lg font-black leading-5">{item.title}</div>
                      <div className="mt-1 text-sm font-black text-slate-400">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                );

                if (!item.active) return <div key={item.title}>{content}</div>;

                return (
                  <Link key={item.title} href={item.href}>
                    {content}
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 rounded-[1.4rem] bg-[#07152f] p-5 text-white">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                MosaicAuto
              </h2>

              <p className="mt-3 text-base leading-7 text-white/72">
                Простая витрина автомобилей из Японии: японские аукционы,
                каталог, быстрый поиск по марке и расчёт стоимости.
              </p>

              <Link
                href="/catalog"
                className="mt-5 flex rounded-2xl bg-[#ff2d3d] px-6 py-4 text-center text-sm font-black text-white transition hover:bg-white hover:text-[#07152f]"
              >
                Перейти к поиску авто
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.num}
              className="rounded-[1.4rem] bg-white p-5 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff2d3d] text-lg font-black text-white">
                {step.num}
              </div>

              <h3 className="mt-4 text-xl font-black">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}