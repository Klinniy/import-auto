"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

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
  body?: string;
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
  status?: string;
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
  error?: string;
};

type CbrCurrency = {
  value: number;
};

type CbrResponse = {
  ok?: boolean;
  currencies?: {
    JPY?: CbrCurrency;
    CNY?: CbrCurrency;
  };
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

  return [];
}

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

function formatRate(value?: number | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

function formatPrice(value?: number | string | null) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `¥ ${formatNumber(n)}`;
}

function carImage(car: Car) {
  const fallback = "/mosaic/car-placeholder.png";

  if (Array.isArray(car.images) && car.images.length > 0) {
    const first = car.images[0];

    if (typeof first === "string") return first || car.previewImage || fallback;

    if (first && typeof first === "object") {
      return first.original || first.medium || first.preview || car.previewImage || fallback;
    }
  }

  if (car.images && typeof car.images === "object" && !Array.isArray(car.images)) {
    return car.images.original || car.images.medium || car.images.preview || car.previewImage || fallback;
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

function cleanBadge(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text || text === "-" || text === "—") return "";

  if (
    text.length > 10 ||
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

function tokyoTime() {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tokyo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export default function CatalogFull() {
  const [initialized, setInitialized] = useState(false);
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [models, setModels] = useState<Option[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [rates, setRates] = useState<CbrResponse | null>(null);

  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [mileageTo, setMileageTo] = useState("");
  const [auction, setAuction] = useState("");
  const [rateFrom, setRateFrom] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState("");

  const brands = useMemo(() => {
    return (filters?.filters?.brands || [])
      .filter((item) => optionLabel(item))
      .sort((a, b) => optionLabel(a).localeCompare(optionLabel(b), "en"));
  }, [filters]);

  const years = useMemo(() => {
    return (filters?.filters?.years || [])
      .filter((item) => {
        const year = Number(optionValue(item));
        return year >= 1990 && year <= 2026;
      })
      .slice(0, 45);
  }, [filters]);

  const auctions = filters?.filters?.auctions || [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setBrand(params.get("brand") || "");
    setModel(params.get("model") || "");
    setQ(params.get("q") || "");
    setQDraft(params.get("q") || "");
    setYearFrom(params.get("yearFrom") || "");
    setYearTo(params.get("yearTo") || "");
    setMileageTo(params.get("mileageTo") || "");
    setAuction(params.get("auction") || "");
    setRateFrom(params.get("rateFrom") || "");
    setPage(Number(params.get("page") || 1) || 1);
    setInitialized(true);
  }, []);

  useEffect(() => {
    setLoadingFilters(true);

    fetch("/api/filters", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => setFilters(payload))
      .catch(() => setFilters(null))
      .finally(() => setLoadingFilters(false));

    fetch("/api/cbr", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: CbrResponse) => setRates(payload))
      .catch(() => setRates(null));
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
    if (!initialized) return;

    const params = new URLSearchParams();

    if (brand) params.set("brand", brand);
    if (model) params.set("model", model);
    if (q) params.set("q", q);
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo) params.set("yearTo", yearTo);
    if (mileageTo) params.set("mileageTo", mileageTo);
    if (auction) params.set("auction", auction);
    if (rateFrom) params.set("rateFrom", rateFrom);

    params.set("page", String(page));
    params.set("limit", "24");

    const qs = params.toString();
    window.history.replaceState(null, "", `/catalog?${qs}`);

    setLoading(true);
    setError("");

    fetch(`/api/catalog?${qs}`, { cache: "no-store" })
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
  }, [initialized, brand, model, q, yearFrom, yearTo, mileageTo, auction, rateFrom, page]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQ(qDraft.trim());
  }

  function reset() {
    setBrand("");
    setModel("");
    setQ("");
    setQDraft("");
    setYearFrom("");
    setYearTo("");
    setMileageTo("");
    setAuction("");
    setRateFrom("");
    setPage(1);
  }

  function setFilter(action: () => void) {
    setPage(1);
    action();
  }

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <header className="border-t-4 border-[#d8001f] border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-3 py-2">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded bg-slate-100 px-2.5 py-1.5 text-[12px] font-black uppercase text-slate-600 hover:bg-[#111827] hover:text-white"
            >
              Начало
            </Link>

            <div className="hidden items-center gap-2 text-[13px] font-black text-slate-500 md:flex">
              <span>TOKYO</span>
              <span className="text-[#111827]">{tokyoTime()}</span>
            </div>

            <div className="text-[13px] font-black text-blue-700">
              {formatNumber(total)} авто из Японии
            </div>
          </div>

          <div className="hidden items-center gap-2 xl:flex">
            <div className="rounded bg-slate-50 px-3 py-1.5 text-[12px] font-black ring-1 ring-slate-100">
              ЦБ · 100 JPY: {formatRate(rates?.currencies?.JPY?.value)} ₽
            </div>
            <div className="rounded bg-slate-50 px-3 py-1.5 text-[12px] font-black ring-1 ring-slate-100">
              ЦБ · 1 CNY: {formatRate(rates?.currencies?.CNY?.value)} ₽
            </div>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-[#07152f] px-4 py-2 text-[12px] font-black text-white hover:bg-[#d8001f]"
          >
            На главную
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-[1800px] gap-3 px-3 py-3">
        <aside className="hidden w-9 shrink-0 border-r border-slate-100 pr-2 text-[11px] font-black text-slate-500 lg:block">
          {["CS", "BC", "ПП", "BT", "CP", "100", "LHD"].map((item, index) => (
            <div
              key={item}
              className={`mb-2 flex h-7 items-center justify-center rounded ${
                index === 5 ? "bg-lime-100 text-lime-700" : "bg-slate-50"
              }`}
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="min-w-0 flex-1">
          <form
            onSubmit={submitSearch}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm"
          >
            <div className="grid gap-3 lg:grid-cols-[280px_280px_260px_1fr]">
              <div>
                <div className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#d8001f]">
                  Марка
                </div>

                <select
                  value={brand}
                  disabled={loadingFilters}
                  size={10}
                  onChange={(event) => setFilter(() => setBrand(event.target.value))}
                  className="h-[220px] w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[13px] font-black outline-none focus:border-blue-400"
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
              </div>

              <div>
                <div className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#d8001f]">
                  Модель
                </div>

                <select
                  value={model}
                  disabled={!brand || models.length === 0}
                  size={10}
                  onChange={(event) => setFilter(() => setModel(event.target.value))}
                  className="h-[220px] w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[13px] font-black outline-none focus:border-blue-400 disabled:opacity-45"
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
              </div>

              <div>
                <div className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#d8001f]">
                  Параметры
                </div>

                <div className="grid gap-2">
                  <input
                    value={qDraft}
                    onChange={(event) => setQDraft(event.target.value)}
                    placeholder="Номер лота / текст"
                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-black outline-none focus:border-blue-400"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={yearFrom}
                      onChange={(event) => setFilter(() => setYearFrom(event.target.value))}
                      className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-[12px] font-black outline-none"
                    >
                      <option value="">Год от</option>
                      {years.map((item) => {
                        const value = optionValue(item);
                        return <option key={`from-${value}`} value={value}>{value}</option>;
                      })}
                    </select>

                    <select
                      value={yearTo}
                      onChange={(event) => setFilter(() => setYearTo(event.target.value))}
                      className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-[12px] font-black outline-none"
                    >
                      <option value="">Год до</option>
                      {years.map((item) => {
                        const value = optionValue(item);
                        return <option key={`to-${value}`} value={value}>{value}</option>;
                      })}
                    </select>
                  </div>

                  <input
                    value={mileageTo}
                    inputMode="numeric"
                    onChange={(event) => setFilter(() => setMileageTo(event.target.value.replace(/\D/g, "")))}
                    placeholder="Пробег до, км"
                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-black outline-none focus:border-blue-400"
                  />

                  <select
                    value={auction}
                    onChange={(event) => setFilter(() => setAuction(event.target.value))}
                    className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-[12px] font-black outline-none"
                  >
                    <option value="">Любой аукцион</option>
                    {auctions.slice(0, 160).map((item) => {
                      const value = optionValue(item);

                      return (
                        <option key={value} value={value}>
                          {optionLabel(item)} {item.count ? `— ${item.count}` : ""}
                        </option>
                      );
                    })}
                  </select>

                  <select
                    value={rateFrom}
                    onChange={(event) => setFilter(() => setRateFrom(event.target.value))}
                    className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-[12px] font-black outline-none"
                  >
                    <option value="">Оценка от</option>
                    <option value="3">3</option>
                    <option value="3.5">3.5</option>
                    <option value="4">4</option>
                    <option value="4.5">4.5</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-3">
                <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                  <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                    быстрый поиск
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-600">
                    Выберите марку, модель или введите номер лота. Результаты обновятся справа ниже.
                  </div>
                </div>

                <div className="grid gap-2">
                  <button
                    type="submit"
                    className="h-12 rounded-lg bg-gradient-to-b from-[#5ab3ff] to-[#2f80ed] text-sm font-black uppercase tracking-[0.16em] text-white shadow"
                  >
                    поиск
                  </button>

                  <button
                    type="button"
                    onClick={reset}
                    className="h-10 rounded-lg border border-slate-300 bg-white text-[12px] font-black uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-100"
                  >
                    сброс
                  </button>

                  <button
                    type="button"
                    onClick={() => alert("Расширенный поиск появится следующим этапом")}
                    className="text-left text-[12px] font-black uppercase tracking-[0.14em] text-amber-600"
                  >
                    расширенный поиск скоро
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="my-3 h-8 rounded bg-[#fff5cc] px-4 py-2 text-[12px] font-black uppercase text-[#9a1b1b]">
            Войдите, чтобы видеть всю информацию по лоту
          </div>

          <div className="mb-3 flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                найдено
              </div>
              <h1 className="text-2xl font-black tracking-[-0.04em]">
                {formatNumber(total)} авто
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="h-9 rounded-lg bg-slate-100 px-4 text-sm font-black hover:bg-[#07152f] hover:text-white disabled:opacity-40"
              >
                ←
              </button>

              <div className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-black">
                стр. {page} из {formatNumber(pages)}
              </div>

              <button
                disabled={page >= pages || loading}
                onClick={() => setPage((current) => Math.min(pages, current + 1))}
                className="h-9 rounded-lg bg-slate-100 px-4 text-sm font-black hover:bg-[#07152f] hover:text-white disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[170px] animate-pulse rounded-xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <div className="text-2xl font-black">Лоты не найдены</div>
              <p className="mt-2 text-slate-500">Попробуйте изменить параметры поиска.</p>
              <button
                onClick={reset}
                className="mt-5 rounded-lg bg-[#d8001f] px-6 py-3 font-black text-white"
              >
                Сбросить
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {cars.map((car) => {
                const image = carImage(car);
                const title = `${car.brand || "AUTO"} ${car.model || ""}`.trim();
                const rate = cleanBadge(car.rate || car.grade);

                return (
                  <Link
                    key={car.id || `${car.lot}-${title}`}
                    href={`/catalog/${car.id}`}
                    className="group grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md md:grid-cols-[230px_1fr]"
                  >
                    <div className="relative h-44 bg-slate-100 md:h-full">
                      <img
                        src={image}
                        alt={title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = "/mosaic/car-placeholder.png";
                        }}
                      />

                      <div className="absolute left-2 top-2 rounded bg-white/92 px-2 py-1 text-[11px] font-black shadow-sm">
                        LOT {car.lot || "—"}
                      </div>

                      {rate && (
                        <div className="absolute bottom-2 left-2 rounded bg-[#d8001f] px-2 py-1 text-[11px] font-black text-white">
                          {rate}
                        </div>
                      )}

                      {isSanction(car) && (
                        <div className="absolute right-2 top-2 rounded bg-yellow-400 px-2 py-1 text-[11px] font-black">
                          санкц.
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
                        <div>
                          <h2 className="text-xl font-black uppercase tracking-[-0.04em]">
                            {title}
                          </h2>

                          <div className="mt-1 text-[12px] font-black uppercase tracking-[0.12em] text-slate-400">
                            {car.year || "—"} · {car.auction || "Аукцион"} · {car.auctionDate || "дата не указана"}
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                            <div className="rounded-lg bg-slate-50 p-3">
                              <div className="text-[11px] font-bold text-slate-400">Пробег</div>
                              <b>{formatNumber(car.mileage)} км</b>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3">
                              <div className="text-[11px] font-bold text-slate-400">Объем</div>
                              <b>{formatNumber(car.engineVolume)} см³</b>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3">
                              <div className="text-[11px] font-bold text-slate-400">КПП</div>
                              <b>{car.transmission || "—"}</b>
                            </div>

                            <div className="rounded-lg bg-slate-50 p-3">
                              <div className="text-[11px] font-bold text-slate-400">Привод</div>
                              <b>{car.drive || "—"}</b>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-[11px] font-bold text-slate-400">Старт</div>
                              <div className="font-black">{formatPrice(car.startPrice)}</div>
                            </div>

                            <div>
                              <div className="text-[11px] font-bold text-slate-400">Финиш</div>
                              <div className="font-black">{formatPrice(car.finishPrice)}</div>
                            </div>
                          </div>

                          <div className="mt-3 rounded-lg bg-[#07152f] px-4 py-3 text-center text-sm font-black text-white group-hover:bg-[#d8001f]">
                            Подробнее
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
