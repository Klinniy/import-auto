"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Option = {
  value?: string;
  label?: string;
  name?: string;
  count?: number;
};

type FiltersResponse = {
  ok?: boolean;
  filters?: {
    brands?: Option[];
    years?: Option[];
    auctions?: Option[];
  };
};

type CatalogResponse = {
  ok?: boolean;
  total?: number;
  items?: unknown[];
};

function optionValue(option: Option) {
  return String(option.value || option.name || option.label || "").trim();
}

function optionLabel(option: Option) {
  return String(option.label || option.name || option.value || "").trim();
}

function formatNumber(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return "—";

  const n = Number(value);

  if (!Number.isFinite(n)) return String(value);

  return new Intl.NumberFormat("ru-RU").format(n);
}

function clockLabel() {
  const now = new Date();

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tokyo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

export default function AfaHome() {
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [total, setTotal] = useState(0);
  const [tokyoTime, setTokyoTime] = useState("");

  const brands = useMemo(() => {
    return (filters?.filters?.brands || [])
      .filter((item) => optionLabel(item))
      .sort((a, b) => optionLabel(a).localeCompare(optionLabel(b), "en"));
  }, [filters]);

  const mainBrands = useMemo(() => {
    const names = [
      "TOYOTA",
      "NISSAN",
      "HONDA",
      "MAZDA",
      "MITSUBISHI",
      "SUBARU",
      "SUZUKI",
      "DAIHATSU",
      "LEXUS",
      "MERCEDES BENZ",
      "BMW",
      "AUDI",
    ];

    const byName = new Map(
      brands.map((item) => [optionLabel(item).toUpperCase(), item])
    );

    return names
      .map((name) => byName.get(name))
      .filter(Boolean) as Option[];
  }, [brands]);

  const otherBrands = useMemo(() => {
    const mainSet = new Set(mainBrands.map((item) => optionLabel(item).toUpperCase()));

    return brands.filter((item) => !mainSet.has(optionLabel(item).toUpperCase()));
  }, [brands, mainBrands]);

  useEffect(() => {
    setTokyoTime(clockLabel());

    const timer = setInterval(() => {
      setTokyoTime(clockLabel());
    }, 30_000);

    fetch("/api/filters", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => setFilters(payload))
      .catch(() => setFilters(null));

    fetch("/api/catalog?page=1&limit=1", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: CatalogResponse) => setTotal(Number(payload.total || 0)))
      .catch(() => setTotal(0));

    return () => clearInterval(timer);
  }, []);

  const sections = [
    {
      title: "Японские автоаукционы",
      subtitle: "поиск и каталог авто",
      count: total,
      href: "/catalog",
      active: true,
      accent: "from-blue-600 to-slate-900",
      image: "🚙",
    },
    {
      title: "Статистика продаж",
      subtitle: "скоро подключим",
      count: 0,
      href: "#soon",
      active: false,
      accent: "from-slate-700 to-slate-950",
      image: "📊",
    },
    {
      title: "Авто по фикс. цене",
      subtitle: "скоро появится",
      count: 0,
      href: "#soon",
      active: false,
      accent: "from-amber-500 to-slate-950",
      image: "🏷️",
    },
    {
      title: "Автомобили из Кореи",
      subtitle: "скоро появится",
      count: 0,
      href: "#soon",
      active: false,
      accent: "from-red-600 to-slate-950",
      image: "🇰🇷",
    },
    {
      title: "Автомобили из Китая",
      subtitle: "скоро появится",
      count: 0,
      href: "#soon",
      active: false,
      accent: "from-yellow-500 to-slate-950",
      image: "🇨🇳",
    },
  ];

  const tools = [
    ["Авто в наличии", "/catalog", "🚗"],
    ["Автокалькулятор", "#soon", "🧮"],
    ["Корейский калькулятор", "#soon", "🧮"],
    ["Китайский калькулятор", "#soon", "🧮"],
    ["Месяц выпуска", "#soon", "📅"],
    ["Каталог автомобилей", "/catalog", "📋"],
  ];

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black uppercase text-slate-600 transition hover:bg-[#07152f] hover:text-white"
            >
              Начало
            </Link>

            <div className="hidden items-center gap-2 text-sm font-black text-slate-500 md:flex">
              <span>TOKYO</span>
              <span className="text-[#07152f]">{tokyoTime || "—"}</span>
            </div>

            <div className="text-sm font-black text-blue-700">
              {formatNumber(total)} авто из Японии
            </div>
          </div>

          <Link
            href="/catalog"
            className="rounded-xl bg-[#07152f] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#ff2d3d]"
          >
            Вход / Каталог
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-5 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {sections.map((section) => {
            const card = (
              <div
                className={`group relative h-full overflow-hidden rounded-[1.4rem] bg-gradient-to-br ${section.accent} p-4 text-white shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-2xl`}
              >
                {!section.active && (
                  <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#07152f]">
                    скоро
                  </div>
                )}

                <div className="flex h-24 items-center justify-between">
                  <div className="text-6xl drop-shadow-md">{section.image}</div>
                  <div className="h-16 w-24 rounded-2xl bg-white/12 ring-1 ring-white/10" />
                </div>

                <h2 className="mt-4 min-h-[56px] text-xl font-black uppercase leading-tight tracking-[-0.04em]">
                  {section.title}
                </h2>

                <div className="mt-2 text-sm font-bold text-white/72">
                  {section.subtitle}
                </div>

                <div className="mt-1 text-sm font-black text-white">
                  {section.active
                    ? `${formatNumber(section.count)} автомобилей`
                    : "раздел в разработке"}
                </div>
              </div>
            );

            return section.active ? (
              <Link key={section.title} href={section.href}>
                {card}
              </Link>
            ) : (
              <div key={section.title} id="soon">
                {card}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-5 px-4 pb-5 lg:grid-cols-[1fr_560px] lg:px-6">
        <div className="rounded-[1.4rem] bg-white p-5 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff2d3d]">
                японские автоаукционы
              </div>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                Поиск по марке
              </h1>
            </div>

            <Link
              href="/catalog"
              className="rounded-xl bg-[#ff2d3d] px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-100 transition hover:bg-[#e51d2d]"
            >
              Открыть каталог →
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {mainBrands.map((brand) => {
              const value = optionValue(brand);

              return (
                <Link
                  key={value}
                  href={`/catalog?brand=${encodeURIComponent(value)}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-black ring-1 ring-slate-100 transition hover:bg-[#07152f] hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-slate-300" />
                    {optionLabel(brand)}
                  </span>
                  <span className="text-xs text-slate-400">{formatNumber(brand.count)}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 grid gap-x-8 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
            {otherBrands.slice(0, 56).map((brand) => {
              const value = optionValue(brand);

              return (
                <Link
                  key={value}
                  href={`/catalog?brand=${encodeURIComponent(value)}`}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 text-sm font-bold transition hover:text-[#ff2d3d]"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-slate-300" />
                    {optionLabel(brand)}
                  </span>
                  <span className="text-xs text-slate-400">{formatNumber(brand.count)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[1.4rem] bg-white p-5 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff2d3d]">
            быстрые разделы
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tools.map(([title, href, icon]) => {
              const soon = href === "#soon";

              const content = (
                <div className="flex min-h-[86px] items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 transition hover:bg-[#07152f] hover:text-white">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                    {icon}
                  </div>

                  <div>
                    <div className="font-black leading-tight">{title}</div>
                    <div className="mt-1 text-xs font-bold text-slate-400">
                      {soon ? "скоро появится" : "перейти"}
                    </div>
                  </div>
                </div>
              );

              return soon ? (
                <div key={title}>{content}</div>
              ) : (
                <Link key={title} href={href}>
                  {content}
                </Link>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl bg-[#07152f] p-5 text-white">
            <h2 className="text-xl font-black tracking-[-0.04em]">
              MosaicAuto
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Простая витрина автомобилей из Японии. Корея, Китай и FIX-разделы
              будут добавлены позже, сейчас рабочий основной раздел — японские
              аукционы и каталог.
            </p>

            <Link
              href="/catalog"
              className="mt-4 flex w-full justify-center rounded-2xl bg-[#ff2d3d] px-5 py-3 text-sm font-black text-white transition hover:bg-[#e51d2d]"
            >
              Перейти к поиску авто
            </Link>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-10 lg:px-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["1", "Выбор авто", "Марка, модель, год, пробег, оценка."],
            ["2", "Проверка лота", "Фото, аукционный лист, состояние."],
            ["3", "Расчет", "Стоимость покупки, доставки и оформления."],
            ["4", "Сопровождение", "От ставки до получения автомобиля."],
          ].map(([num, title, text]) => (
            <div
              key={num}
              className="rounded-[1.4rem] bg-white p-5 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff2d3d] font-black text-white">
                {num}
              </div>
              <h3 className="mt-4 font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
