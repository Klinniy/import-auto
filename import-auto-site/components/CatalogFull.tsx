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
    rates?: Option[];
    colors?: Option[];
    transmissions?: Option[];
    drives?: Option[];
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

function formatRateValue(value?: number | null) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(n);
}

function formatPrice(value?: number | string | null) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "0 ¥";
  return `${formatNumber(n)} ¥`;
}

function carImages(car: Car) {
  const result: string[] = [];

  if (Array.isArray(car.images)) {
    for (const item of car.images) {
      if (!item) continue;

      if (typeof item === "string") {
        result.push(item);
      } else {
        result.push(item.original || item.medium || item.preview || "");
      }
    }
  } else if (car.images && typeof car.images === "object") {
    result.push(car.images.original || car.images.medium || car.images.preview || "");
  }

  if (car.previewImage) result.push(car.previewImage);

  return Array.from(new Set(result.filter(Boolean)));
}

function firstImage(car: Car) {
  return carImages(car)[0] || "/mosaic/car-placeholder.png";
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

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
  const [transmission, setTransmission] = useState("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState("");
  const [body, setBody] = useState("");
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
  const transmissions = filters?.filters?.transmissions || [];
  const colors = filters?.filters?.colors || [];

  const bodyOptions = ["FE0", "SNFE0", "NCP", "ZVW", "ANH", "ATH", "AHR", "GRS"];
  const statusOptions = ["не продан", "Sold", "Not Sold"];
  const rateOptions = ["3", "3.5", "4", "4.5", "5", "R"];

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
    setTransmission(params.get("transmission") || "");
    setColor(params.get("color") || "");
    setStatus(params.get("status") || "");
    setBody(params.get("body") || "");
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
    if (transmission) params.set("transmission", transmission);
    if (color) params.set("color", color);
    if (status) params.set("status", status);
    if (body) params.set("body", body);

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
  }, [
    initialized,
    brand,
    model,
    q,
    yearFrom,
    yearTo,
    mileageTo,
    auction,
    rateFrom,
    transmission,
    color,
    status,
    body,
    page,
  ]);

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
    setTransmission("");
    setColor("");
    setStatus("");
    setBody("");
    setPage(1);
  }

  function setFilter(action: () => void) {
    setPage(1);
    action();
  }

  function toggleValue(current: string, value: string, setter: (value: string) => void) {
    setFilter(() => setter(current === value ? "" : value));
  }

  return (
    <main className="min-h-screen bg-white text-[#111827]">
      <header className="border-t-4 border-[#d8001f] border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-none items-center justify-between gap-4 px-3 py-1.5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded bg-slate-100 px-2.5 py-1 text-[12px] font-black uppercase text-slate-600 hover:bg-[#111827] hover:text-white"
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
            <div className="rounded bg-slate-50 px-3 py-1 text-[12px] font-black ring-1 ring-slate-100">
              ЦБ · 100 JPY {formatRateValue(rates?.currencies?.JPY?.value)} ₽
            </div>
            <div className="rounded bg-slate-50 px-3 py-1 text-[12px] font-black ring-1 ring-slate-100">
              ЦБ · 1 CNY {formatRateValue(rates?.currencies?.CNY?.value)} ₽
            </div>
          </div>

          <Link
            href="/"
            className="rounded bg-[#07152f] px-4 py-1.5 text-[12px] font-black text-white hover:bg-[#d8001f]"
          >
            На главную
          </Link>
        </div>
      </header>

      <section className="flex max-w-none gap-2 px-3 py-2">
        <aside className="hidden w-8 shrink-0 text-[10px] font-black text-slate-500 lg:block">
          {["CS", "BC", "ПП", "BT", "CP", "☝", "100", "LHD"].map((item, index) => (
            <div
              key={item}
              className={`mb-1 flex h-7 items-center justify-center rounded ${
                index === 6 ? "bg-lime-100 text-lime-700" : "bg-slate-50"
              }`}
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="min-w-0 flex-1">
          <form
            onSubmit={submitSearch}
            className="rounded-lg border border-slate-200 bg-[#f8fafc] p-2 shadow-sm"
          >
            <div className="grid gap-2 xl:grid-cols-[300px_300px_210px_1fr]">
              <div>
                <div className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#d8001f]">
                  Марка
                </div>
                <select
                  value={brand}
                  disabled={loadingFilters}
                  size={12}
                  onChange={(event) => setFilter(() => setBrand(event.target.value))}
                  className="h-[252px] w-full rounded border border-slate-300 bg-white px-2 py-1 text-[13px] font-bold outline-none focus:border-blue-500"
                >
                  <option value="">Любая</option>
                  {brands.map((item) => {
                    const value = optionValue(item);
                    return (
                      <option key={value} value={value}>
                        {optionLabel(item)} {item.count ? `— ${formatNumber(item.count)}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <div className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#d8001f]">
                  Модель
                </div>
                <select
                  value={model}
                  disabled={!brand || models.length === 0}
                  size={12}
                  onChange={(event) => setFilter(() => setModel(event.target.value))}
                  className="h-[252px] w-full rounded border border-slate-300 bg-white px-2 py-1 text-[13px] font-bold outline-none focus:border-blue-500 disabled:opacity-45"
                >
                  <option value="">Любая</option>
                  {models.map((item) => {
                    const value = optionValue(item);
                    return (
                      <option key={value} value={value}>
                        {optionLabel(item)} {item.count ? `— ${formatNumber(item.count)}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <div className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-[#d8001f]">
                  Параметры
                </div>

                <div className="grid gap-1.5">
                  <input
                    value={qDraft}
                    onChange={(event) => setQDraft(event.target.value)}
                    placeholder="Номер лота"
                    className="h-8 rounded border border-slate-300 bg-white px-2 text-[12px] font-bold outline-none"
                  />

                  <div className="grid grid-cols-2 gap-1.5 text-[12px]">
                    <select
                      value={yearFrom}
                      onChange={(event) => setFilter(() => setYearFrom(event.target.value))}
                      className="h-8 rounded border border-slate-300 bg-white px-1 font-bold outline-none"
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
                      className="h-8 rounded border border-slate-300 bg-white px-1 font-bold outline-none"
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
                    className="h-8 rounded border border-slate-300 bg-white px-2 text-[12px] font-bold outline-none"
                  />

                  <input
                    disabled
                    placeholder="Объем от / до"
                    className="h-8 rounded border border-slate-200 bg-slate-100 px-2 text-[12px] font-bold text-slate-400 outline-none"
                  />

                  <button
                    type="submit"
                    className="mt-1 h-9 rounded bg-gradient-to-b from-[#68b8ff] to-[#2f80ed] text-[12px] font-black uppercase tracking-[0.16em] text-white shadow"
                  >
                    Поиск
                  </button>

                  <button
                    type="button"
                    onClick={reset}
                    className="h-8 rounded border border-slate-300 bg-white text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 hover:bg-slate-100"
                  >
                    Сброс
                  </button>

                  <button
                    type="button"
                    onClick={() => alert("Расширенный поиск появится следующим этапом")}
                    className="text-left text-[11px] font-black uppercase tracking-[0.16em] text-amber-600"
                  >
                    Расширенный поиск скоро
                  </button>
                </div>
              </div>

              <div className="grid gap-x-5 gap-y-2 md:grid-cols-3 xl:grid-cols-6">
                <FilterColumn
                  title="Кузов"
                  items={bodyOptions}
                  active={body}
                  onPick={(value) => toggleValue(body, value, setBody)}
                />

                <FilterColumn
                  title="Оценка"
                  items={rateOptions}
                  active={rateFrom}
                  onPick={(value) => toggleValue(rateFrom, value, setRateFrom)}
                />

                <FilterColumn
                  title="Аукцион"
                  items={auctions.slice(0, 7).map(optionLabel)}
                  active={auction}
                  onPick={(value) => toggleValue(auction, value, setAuction)}
                />

                <FilterColumn
                  title="Цвета"
                  items={(colors.length ? colors.slice(0, 7).map(optionLabel) : ["белый", "жемчужный", "коричневый", "черный"])}
                  active={color}
                  onPick={(value) => toggleValue(color, value, setColor)}
                />

                <FilterColumn
                  title="Статус"
                  items={statusOptions}
                  active={status}
                  onPick={(value) => toggleValue(status, value, setStatus)}
                />

                <FilterColumn
                  title="КПП"
                  items={(transmissions.length ? transmissions.slice(0, 5).map(optionLabel) : ["AT", "FAT", "CVT", "MT"])}
                  active={transmission}
                  onPick={(value) => toggleValue(transmission, value, setTransmission)}
                />
              </div>
            </div>
          </form>

          <div className="my-2 h-7 bg-[#fff5cc] px-4 py-1.5 text-[12px] font-black uppercase text-[#9a1b1b]">
            Войдите, чтобы видеть всю информацию по лоту
          </div>

          <div className="mb-2 flex items-center justify-between">
            <div className="text-[15px] font-black">
              <span className="text-lime-700">{cars.length}</span>{" "}
              {brand || "Автомобили"}
              {model ? ` ${model}` : ""}
            </div>

            <div className="flex items-center gap-1 text-[12px]">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded bg-slate-100 px-3 py-1 font-black disabled:opacity-40"
              >
                ←
              </button>
              <span className="rounded bg-slate-100 px-3 py-1 font-black">
                List A · стр. {page} из {formatNumber(pages)}
              </span>
              <button
                disabled={page >= pages || loading}
                onClick={() => setPage((current) => Math.min(pages, current + 1))}
                className="rounded bg-slate-100 px-3 py-1 font-black disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-2 rounded border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid gap-1">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="h-[92px] animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div className="rounded bg-slate-50 p-10 text-center">
              <div className="text-2xl font-black">Лоты не найдены</div>
              <button
                onClick={reset}
                className="mt-4 rounded bg-[#d8001f] px-5 py-2 font-black text-white"
              >
                Сбросить
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] border-collapse text-[12px]">
                <thead>
                  <tr className="bg-gradient-to-b from-white to-slate-100 text-slate-600">
                    <Th>Фото</Th>
                    <Th>Номер лота</Th>
                    <Th>Дата аукцион / Аукцион</Th>
                    <Th>Год / Кузов</Th>
                    <Th>Объем, см³ / Комплектация</Th>
                    <Th>Пробег / Оценка</Th>
                    <Th>Начальная / Продано за</Th>
                    <Th>Средняя цена</Th>
                  </tr>
                </thead>

                <tbody>
                  {cars.map((car, index) => {
                    const images = carImages(car).slice(0, 3);
                    const title = `${car.brand || "AUTO"} ${car.model || ""}`.trim();
                    const rate = cleanBadge(car.rate || car.grade);

                    return (
                      <tr
                        key={car.id || `${car.lot}-${title}`}
                        className={index % 2 === 0 ? "bg-white" : "bg-[#f1f1f1]"}
                      >
                        <td className="border-b border-white p-1 align-top">
                          <Link href={`/catalog/${car.id}`} className="flex gap-1">
                            {(images.length ? images : [firstImage(car)]).map((image) => (
                              <img
                                key={image}
                                src={image}
                                alt={title}
                                className="h-[72px] w-[86px] rounded object-cover"
                                loading="lazy"
                                onError={(event) => {
                                  event.currentTarget.src = "/mosaic/car-placeholder.png";
                                }}
                              />
                            ))}
                          </Link>
                        </td>

                        <td className="border-b border-white p-2 align-top">
                          <Link href={`/catalog/${car.id}`} className="inline-block rounded border border-slate-300 bg-white px-4 py-2 text-base font-black text-[#b24a1b] shadow-sm">
                            {car.lot || "—"}
                          </Link>
                          <div className="mt-1 text-[11px] text-slate-400">☆ ☆ ☆ ☆ ☆</div>
                        </td>

                        <td className="border-b border-white p-2 align-top text-center">
                          <div>{car.auctionDate || "—"}</div>
                          <div className="font-black">{car.auction || "—"}</div>
                        </td>

                        <td className="border-b border-white p-2 align-top">
                          <div>
                            <span className="font-black text-[#c83a1a]">{car.year || "—"}</span>{" "}
                            {cleanText(car.body) || "—"}
                          </div>
                          <div className="mt-1 font-black">{title}</div>
                        </td>

                        <td className="border-b border-white p-2 align-top">
                          <div>
                            <span className="font-black text-[#c83a1a]">{car.transmission || "—"}</span>{" "}
                            {formatNumber(car.engineVolume)} cc
                          </div>
                          <div className="mt-1 text-slate-500">
                            {car.color || "—"} {car.drive || ""}
                          </div>
                        </td>

                        <td className="border-b border-white p-2 align-top text-center">
                          <div>{formatNumber(car.mileage)} km</div>
                          <div className="mt-1 font-black text-[#b88718]">
                            ▲ {rate || "—"}
                          </div>
                        </td>

                        <td className="border-b border-white p-2 align-top text-right">
                          <div>{formatPrice(car.startPrice)}</div>
                          <div className="mt-1">{formatPrice(car.finishPrice)}</div>
                          <div className="text-[11px] text-slate-500">
                            {isSanction(car) ? "санкц." : car.status || ""}
                          </div>
                        </td>

                        <td className="border-b border-white p-2 align-top text-right">
                          <div className="font-black text-green-700">
                            {formatPrice(car.averagePrice)}
                          </div>
                          <Link
                            href={`/catalog/${car.id}`}
                            className="mt-2 inline-block rounded bg-[#07152f] px-4 py-2 text-[12px] font-black text-white hover:bg-[#d8001f]"
                          >
                            открыть
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-slate-200 px-2 py-2 text-center text-[12px] font-bold">
      {children}
      <span className="ml-1 text-slate-300">↕</span>
    </th>
  );
}

function FilterColumn({
  title,
  items,
  active,
  onPick,
}: {
  title: string;
  items: string[];
  active: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="min-w-[120px]">
      <div className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
        {title}
      </div>

      <div className="grid gap-1">
        {items.filter(Boolean).slice(0, 7).map((item) => {
          const selected = active === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onPick(item)}
              className={`flex items-center gap-1 text-left text-[12px] font-bold leading-4 ${
                selected ? "text-[#d8001f]" : "text-[#111827]"
              }`}
            >
              <span
                className={`h-2 w-2 border ${
                  selected ? "border-[#d8001f] bg-[#d8001f]" : "border-slate-400 bg-white"
                }`}
              />
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
