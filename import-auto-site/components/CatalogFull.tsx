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
    rates?: Option[];
  };
};

type CarImage = {
  original?: string;
  preview?: string;
  medium?: string;
};

type Car = {
  id?: string;
  lot?: string;
  brand?: string;
  model?: string;
  year?: string | number | null;
  auction?: string;
  auctionDate?: string;
  rate?: string | number | null;
  grade?: string | number | null;
  mileage?: number | string | null;
  engineVolume?: number | string | null;
  transmission?: string;
  drive?: string;
  color?: string;
  sanction?: boolean | string | number;
  startPrice?: number | string | null;
  finishPrice?: number | string | null;
  averagePrice?: number | string | null;
  previewImage?: string;
  images?: Array<string | CarImage> | CarImage;
};

type CatalogPayload = {
  ok?: boolean;
  items?: Car[];
  data?: Car[];
  cars?: Car[];
  results?: Car[];
  total?: number;
  pages?: number;
  page?: number;
  limit?: number;
  error?: string;
};

function getArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  const p = payload as {
    data?: unknown;
    items?: unknown;
    cars?: unknown;
    results?: unknown;
  };

  if (Array.isArray(p?.items)) return p.items as T[];
  if (Array.isArray(p?.data)) return p.data as T[];
  if (Array.isArray(p?.cars)) return p.cars as T[];
  if (Array.isArray(p?.results)) return p.results as T[];

  if (p?.data && typeof p.data === "object") {
    const d = p.data as { items?: unknown; cars?: unknown };
    if (Array.isArray(d.items)) return d.items as T[];
    if (Array.isArray(d.cars)) return d.cars as T[];
  }

  return [];
}

function optionLabel(option: Option) {
  return String(option.label || option.name || option.value || "").trim();
}

function optionValue(option: Option) {
  return String(option.value || option.name || option.label || "").trim();
}

function formatNumber(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return "—";

  const num = Number(value);

  if (!Number.isFinite(num)) return String(value);

  return new Intl.NumberFormat("ru-RU").format(num);
}

function formatPrice(value?: number | string | null) {
  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) return "—";

  return `¥ ${formatNumber(num)}`;
}

function carImage(car: Car) {
  const fallback = "/mosaic/car-placeholder.png";

  if (Array.isArray(car.images) && car.images.length > 0) {
    const first = car.images[0];

    if (typeof first === "string") return first || car.previewImage || fallback;

    if (first && typeof first === "object") {
      return first.medium || first.preview || first.original || car.previewImage || fallback;
    }
  }

  if (car.images && typeof car.images === "object" && !Array.isArray(car.images)) {
    return car.images.medium || car.images.preview || car.images.original || car.previewImage || fallback;
  }

  return car.previewImage || fallback;
}

function isSanction(car: Car) {
  const value = car.sanction;

  if (value === true || value === 1) return true;

  if (typeof value === "string") {
    return ["1", "true", "yes", "да", "y"].includes(value.toLowerCase());
  }

  return false;
}

function safeBadge(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text || text === "-" || text === "—") return "";

  if (
    text.length > 8 ||
    text.includes("http") ||
    text.includes("{") ||
    text.includes("[") ||
    text.includes("#") ||
    text.includes("&w=") ||
    text.includes("&h=")
  ) {
    return "";
  }

  return text;
}

export default function CatalogFull() {
  const [filterData, setFilterData] = useState<FiltersResponse | null>(null);
  const [models, setModels] = useState<Option[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [mileageTo, setMileageTo] = useState("");
  const [rateFrom, setRateFrom] = useState("");
  const [auction, setAuction] = useState("");
  const [page, setPage] = useState(1);

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const years = useMemo(() => {
    return (filterData?.filters?.years || [])
      .filter((item) => {
        const year = Number(optionValue(item));
        return year >= 1980 && year <= 2026;
      })
      .slice(0, 70);
  }, [filterData]);

  const brands = filterData?.filters?.brands || [];
  const auctions = filterData?.filters?.auctions || [];

  useEffect(() => {
    setLoadingFilters(true);

    fetch("/api/filters", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => setFilterData(payload))
      .catch(() => setFilterData(null))
      .finally(() => setLoadingFilters(false));
  }, []);

  useEffect(() => {
    if (!brand) {
      setModels([]);
      setModel("");
      return;
    }

    fetch(`/api/models?brand=${encodeURIComponent(brand)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => setModels(getArray<Option>(payload)))
      .catch(() => setModels([]));
  }, [brand]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (brand) params.set("brand", brand);
    if (model) params.set("model", model);
    if (q) params.set("q", q);
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo) params.set("yearTo", yearTo);
    if (mileageTo) params.set("mileageTo", mileageTo);
    if (rateFrom) params.set("rateFrom", rateFrom);
    if (auction) params.set("auction", auction);

    params.set("page", String(page));
    params.set("limit", "24");

    setLoading(true);
    setError("");

    fetch(`/api/catalog?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: CatalogPayload) => {
        if (payload?.ok === false) {
          throw new Error(payload.error || "Catalog API error");
        }

        const items = getArray<Car>(payload);

        setCars(items);
        setTotal(Number(payload.total || items.length || 0));
        setPages(Math.max(1, Number(payload.pages || 1)));
      })
      .catch((err) => {
        setCars([]);
        setTotal(0);
        setPages(1);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, [brand, model, q, yearFrom, yearTo, mileageTo, rateFrom, auction, page]);

  function resetFilters() {
    setBrand("");
    setModel("");
    setQ("");
    setQDraft("");
    setYearFrom("");
    setYearTo("");
    setMileageTo("");
    setRateFrom("");
    setAuction("");
    setPage(1);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQ(qDraft.trim());
  }

  function setFilter(action: () => void) {
    setPage(1);
    action();
  }

  return (
    <main className="min-h-screen bg-[#eef3fa] text-[#07152f]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1720px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-[-0.04em]">
            MOSAIC<span className="text-[#ff2d3d]">AUTO</span>
          </Link>

          <div className="hidden rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 md:block">
            {formatNumber(total)} авто из Японии
          </div>

          <Link
            href="/"
            className="rounded-2xl bg-[#07152f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff2d3d]"
          >
            На главную
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1720px] px-5 py-8 lg:px-8">
        <div className="rounded-[2.2rem] bg-[#07152f] p-7 text-white shadow-2xl shadow-slate-300/70 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.24em] text-red-300">
                каталог авто из Японии
              </div>

              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] md:text-6xl">
                Актуальные лоты японских аукционов
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/65">
                Подберите автомобиль по марке, модели, году, пробегу, оценке и аукциону.
                Карточки обновляются из подключенного каталога.
              </p>
            </div>

            <form onSubmit={submitSearch} className="rounded-[1.7rem] bg-white/8 p-4 ring-1 ring-white/10">
              <div className="mb-2 text-sm font-black text-white/70">Быстрый поиск</div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={qDraft}
                  onChange={(event) => setQDraft(event.target.value)}
                  placeholder="Crown, Prius, CX-5..."
                  className="h-12 rounded-2xl border border-white/10 bg-white px-4 text-sm font-bold text-[#07152f] outline-none"
                />

                <button className="h-12 rounded-2xl bg-[#ff2d3d] px-6 text-sm font-black text-white transition hover:bg-[#e51d2d]">
                  Найти
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1720px] gap-6 px-5 pb-14 lg:grid-cols-[330px_1fr] lg:px-8">
        <aside className="h-fit rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/80 ring-1 ring-slate-200 lg:sticky lg:top-24">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">Фильтры</h2>
              <p className="mt-1 text-sm font-bold text-slate-400">
                Уточните параметры
              </p>
            </div>

            <button
              onClick={resetFilters}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-[#ff2d3d] hover:text-white"
            >
              Сброс
            </button>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Марка</span>
              <select
                value={brand}
                disabled={loadingFilters}
                onChange={(event) => setFilter(() => setBrand(event.target.value))}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-400"
              >
                <option value="">Любая</option>
                {brands.map((item) => {
                  const value = optionValue(item);

                  return (
                    <option key={value} value={value}>
                      {optionLabel(item)} {item.count ? `— ${item.count}` : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Модель</span>
              <select
                value={model}
                disabled={!brand || models.length === 0}
                onChange={(event) => setFilter(() => setModel(event.target.value))}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-400 disabled:opacity-45"
              >
                <option value="">Любая</option>
                {models.map((item) => {
                  const value = optionValue(item);

                  return (
                    <option key={value} value={value}>
                      {optionLabel(item)} {item.count ? `— ${item.count}` : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Год от</span>
                <select
                  value={yearFrom}
                  onChange={(event) => setFilter(() => setYearFrom(event.target.value))}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-400"
                >
                  <option value="">Любой</option>
                  {years.map((item) => {
                    const value = optionValue(item);
                    return <option key={`from-${value}`} value={value}>{value}</option>;
                  })}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Год до</span>
                <select
                  value={yearTo}
                  onChange={(event) => setFilter(() => setYearTo(event.target.value))}
                  className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-400"
                >
                  <option value="">Любой</option>
                  {years.map((item) => {
                    const value = optionValue(item);
                    return <option key={`to-${value}`} value={value}>{value}</option>;
                  })}
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Пробег до, км</span>
              <input
                value={mileageTo}
                onChange={(event) => setFilter(() => setMileageTo(event.target.value.replace(/\D/g, "")))}
                placeholder="100000"
                inputMode="numeric"
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-400"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Аукцион</span>
              <select
                value={auction}
                onChange={(event) => setFilter(() => setAuction(event.target.value))}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-400"
              >
                <option value="">Любой</option>
                {auctions.slice(0, 120).map((item) => {
                  const value = optionValue(item);

                  return (
                    <option key={value} value={value}>
                      {optionLabel(item)} {item.count ? `— ${item.count}` : ""}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Оценка от</span>
              <select
                value={rateFrom}
                onChange={(event) => setFilter(() => setRateFrom(event.target.value))}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-blue-400"
              >
                <option value="">Любая</option>
                <option value="3">3</option>
                <option value="3.5">3.5</option>
                <option value="4">4</option>
                <option value="4.5">4.5</option>
                <option value="5">5</option>
              </select>
            </label>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 rounded-[2rem] bg-white p-5 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 md:flex-row md:items-center">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Найдено
              </div>
              <h2 className="mt-1 text-4xl font-black tracking-[-0.05em]">
                {formatNumber(total)} авто
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="h-11 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700 transition hover:bg-[#07152f] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                ←
              </button>

              <div className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black">
                стр. {page} из {formatNumber(pages)}
              </div>

              <button
                disabled={page >= pages || loading}
                onClick={() => setPage((current) => Math.min(pages, current + 1))}
                className="h-11 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700 transition hover:bg-[#07152f] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 font-bold text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[430px] animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/70 ring-1 ring-slate-200"
                />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-12 text-center shadow-lg shadow-slate-200/70 ring-1 ring-slate-200">
              <div className="text-3xl font-black">Лоты не найдены</div>
              <p className="mt-3 text-slate-500">Попробуйте изменить фильтры или сбросить поиск.</p>
              <button
                onClick={resetFilters}
                className="mt-6 rounded-2xl bg-[#ff2d3d] px-7 py-4 font-black text-white"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {cars.map((car) => {
                const image = carImage(car);
                const title = `${car.brand || "AUTO"} ${car.model || ""}`.trim();
                const rate = safeBadge(car.rate || car.grade);

                return (
                  <Link
                    key={car.id || `${car.lot}-${title}`}
                    href={`/catalog/${car.id}`}
                    className="group overflow-hidden rounded-[2rem] bg-white shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <div className="relative h-56 overflow-hidden bg-slate-100">
                      <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-[#07152f] shadow-sm backdrop-blur">
                        LOT {car.lot || "—"}
                      </div>

                      {isSanction(car) && (
                        <div className="absolute right-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-[#07152f] shadow-sm">
                          санкц.
                        </div>
                      )}

                      {rate && (
                        <div className="absolute bottom-4 left-4 rounded-full bg-[#ff2d3d] px-3 py-1 text-xs font-black text-white shadow-sm">
                          {rate}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="line-clamp-2 text-xl font-black leading-tight tracking-[-0.03em]">
                            {title}
                          </h3>
                          <div className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                            {car.auction || "Аукцион"} · {car.auctionDate || "Дата не указана"}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black">
                          {car.year || "—"}
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs font-bold text-slate-400">Пробег</div>
                          <b>{formatNumber(car.mileage)} км</b>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs font-bold text-slate-400">Объем</div>
                          <b>{formatNumber(car.engineVolume)} см³</b>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs font-bold text-slate-400">КПП</div>
                          <b>{car.transmission || "—"}</b>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-xs font-bold text-slate-400">Привод</div>
                          <b>{car.drive || "—"}</b>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                        <div>
                          <div className="text-xs font-bold text-slate-400">Старт</div>
                          <div className="font-black">{formatPrice(car.startPrice)}</div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-400">Финиш</div>
                          <div className="font-black">{formatPrice(car.finishPrice)}</div>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-[#07152f] px-5 py-4 text-center text-sm font-black text-white transition group-hover:bg-[#ff2d3d]">
                        Подробнее
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
