// @ts-nocheck
"use client";

// @ts-nocheck

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ApiState = {
  summary: any;
  sales: any;
  filters: any;
  loading: boolean;
  error: string;
};

function formatNumber(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

function getArray(...values: any[]) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.cars)) return value.cars;
    if (Array.isArray(value?.brands)) return value.brands;
    if (Array.isArray(value?.filters?.brands)) return value.filters.brands;
    if (Array.isArray(value?.facets?.brands)) return value.facets.brands;
  }

  return [];
}

function pickNumber(...values: any[]) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 0;
}

function pickText(...values: any[]) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }

  return "";
}

function normalizeBrand(item: any) {
  return {
    name: pickText(item?.name, item?.brand, item?.title, item?.label, item?.value),
    count: pickNumber(item?.count, item?.total, item?.qty, item?.amount),
  };
}

function StatCard({ label, value, text }: { label: string; value: string; text: string }) {
  return (
    <div className="rounded-[1.4rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
      <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#07152f]">{value}</div>
      <div className="mt-2 text-sm font-bold leading-6 text-slate-500">{text}</div>
    </div>
  );
}

export default function StatisticsSalesPage() {
  const [state, setState] = useState<ApiState>({
    summary: null,
    sales: null,
    filters: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const [summaryRes, salesRes, filtersRes] = await Promise.all([
          fetch("/api/statistics/summary", { cache: "no-store" }),
          fetch("/api/statistics/sales", { cache: "no-store" }),
          fetch("/api/statistics/filters", { cache: "no-store" }),
        ]);

        const [summary, sales, filters] = await Promise.all([
          summaryRes.json().catch(() => null),
          salesRes.json().catch(() => null),
          filtersRes.json().catch(() => null),
        ]);

        if (!ignore) {
          setState({
            summary,
            sales,
            filters,
            loading: false,
            error: "",
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            summary: null,
            sales: null,
            filters: null,
            loading: false,
            error: String(error),
          });
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  const brands = useMemo(() => {
    return getArray(
      state.filters?.filters?.brands,
      state.filters?.brands,
      state.filters?.facets?.brands,
      state.summary?.brands,
      state.summary?.filters?.brands
    )
      .map(normalizeBrand)
      .filter((item) => item.name)
      .sort((a, b) => b.count - a.count)
      .slice(0, 16);
  }, [state.filters, state.summary]);

  const salesItems = useMemo(() => {
    return getArray(state.sales, state.summary?.sales, state.summary?.items)
      .filter(Boolean)
      .slice(0, 6);
  }, [state.sales, state.summary]);

  const total = pickNumber(
    state.summary?.total,
    state.summary?.count,
    state.summary?.carsTotal,
    state.summary?.salesTotal,
    state.summary?.summary?.total,
    state.sales?.total,
    state.sales?.count
  );

  const brandCount = pickNumber(
    state.summary?.brandsTotal,
    state.summary?.brandCount,
    state.filters?.brandsTotal,
    brands.length
  );

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link href="/" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-[#07152f] hover:text-white">
            ← На главную
          </Link>

          <div className="hidden text-sm font-black uppercase tracking-[0.18em] text-slate-400 md:block">
            MosaicAuto · статистика продаж
          </div>

          <Link href="/catalog" className="rounded-xl bg-[#07152f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff2d3d]">
            В каталог
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-8 lg:px-6">
        <div className="rounded-[1.8rem] bg-[#07152f] p-8 text-white shadow-2xl shadow-slate-300/70">
          <div className="text-sm font-black uppercase tracking-[0.26em] text-[#ff2d3d]">
            статистика продаж
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">
                Проданные автомобили с японских аукционов
              </h1>

              <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-white/72">
                Смотрите реальные продажи, популярные марки и ориентиры по рынку. Эти данные помогают понимать цены перед подбором и покупкой автомобиля.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 text-sm font-bold leading-7 text-white/75 ring-1 ring-white/10">
              Страница использует текущие данные API статистики. Если часть данных временно не загрузилась, каталог и карточки автомобилей остаются доступными.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <StatCard
            label="записей в статистике"
            value={state.loading ? "..." : total ? formatNumber(total) : "—"}
            text="Количество найденных записей по API статистики продаж."
          />

          <StatCard
            label="марки"
            value={state.loading ? "..." : brandCount ? formatNumber(brandCount) : formatNumber(brands.length)}
            text="Марки автомобилей, доступные в статистических данных."
          />

          <StatCard
            label="обновление"
            value="онлайн"
            text="Данные загружаются с серверных API MosaicAuto при открытии страницы."
          />
        </div>

        {state.error ? (
          <div className="mt-6 rounded-2xl bg-red-50 p-5 font-bold text-red-700 ring-1 ring-red-200">
            Не удалось загрузить статистику: {state.error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[1.5rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.22em] text-[#ff2d3d]">популярные марки</div>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Марки в статистике</h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {state.loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                ))
              ) : brands.length ? (
                brands.map((brand) => (
                  <Link
                    key={brand.name}
                    href={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black transition hover:bg-[#07152f] hover:text-white"
                  >
                    <span>› {brand.name}</span>
                    <span className="text-slate-400">{brand.count ? formatNumber(brand.count) : "—"}</span>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  Марки пока не загрузились.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
            <div className="text-sm font-black uppercase tracking-[0.22em] text-[#ff2d3d]">данные продаж</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Последние записи</h2>

            <div className="mt-5 space-y-3">
              {state.loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                ))
              ) : salesItems.length ? (
                salesItems.map((item: any, index: number) => {
                  const brand = pickText(item.brand, item.make, item.marka, item.MARKA_NAME, item.name);
                  const model = pickText(item.model, item.MODEL_NAME, item.title);
                  const year = pickText(item.year, item.YEAR);
                  const price = pickNumber(item.price, item.finishPrice, item.FINISH, item.averagePrice);

                  return (
                    <div key={index} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                      <div>
                        <div className="font-black">{[brand, model].filter(Boolean).join(" ") || "Автомобиль"}</div>
                        <div className="mt-1 text-sm font-bold text-slate-400">{year || "год не указан"}</div>
                      </div>
                      <div className="text-right font-black text-[#07152f]">{price ? `${formatNumber(price)} ¥` : "—"}</div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  Детальные записи продаж пока не загрузились. Используйте каталог и фильтры для подбора автомобиля.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
