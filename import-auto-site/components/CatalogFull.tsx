"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

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
    colors?: Option[];
    transmissions?: Option[];
    drives?: Option[];
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
  leftHandDrive?: boolean;
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
  error?: string;
};

type CbrResponse = {
  ok?: boolean;
  currencies?: {
    JPY?: { value: number };
    CNY?: { value: number };
  };
};

type FilterButton = {
  label: string;
  value: string;
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

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isBadFilterValue(value: unknown) {
  const text = String(value ?? "").toLowerCase().trim();

  return (
    !text ||
    text.includes("actual vehicle") ||
    text.includes("vehicle") ||
    text.includes("http") ||
    text.includes("&#") ||
    text.includes("{") ||
    text.length > 32
  );
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
  if (!Number.isFinite(n) || n <= 0) return "—";

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

function statusLabel(value?: string) {
  const text = String(value || "").toLowerCase().trim();

  if (!text) return "—";
  if (text === "sold" || text.includes("sold by")) return "продан";
  if (text === "not sold") return "не продан";
  if (text === "removed") return "снят";

  return cleanText(value);
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

function optionButtons(options: Option[], limit = 12): FilterButton[] {
  return options
    .map((item) => ({
      label: cleanText(optionLabel(item)),
      value: cleanText(optionValue(item)),
    }))
    .filter((item) => item.label && item.value)
    .filter((item) => !isBadFilterValue(item.label) && !isBadFilterValue(item.value))
    .slice(0, limit);
}

export default function CatalogFull() {
  const [initialized, setInitialized] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
  const [drive, setDrive] = useState("");
  const [color, setColor] = useState("");
  const [status, setStatus] = useState("");
  const [body, setBody] = useState("");
  const [sanction, setSanction] = useState("");
  const [leftHandDrive, setLeftHandDrive] = useState("");
  const [sort, setSort] = useState("");
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

  const auctions = useMemo(() => optionButtons(filters?.filters?.auctions || [], 16), [filters]);
  const colors = useMemo(() => optionButtons(filters?.filters?.colors || [], 16), [filters]);
  const drives = useMemo(() => optionButtons(filters?.filters?.drives || [], 10), [filters]);

  const bodyOptions: FilterButton[] = [
    { label: "FE0", value: "FE0" },
    { label: "SNFE0", value: "SNFE0" },
    { label: "NCP", value: "NCP" },
    { label: "ZVW", value: "ZVW" },
    { label: "ANH", value: "ANH" },
    { label: "ATH", value: "ATH" },
    { label: "AHR", value: "AHR" },
  ];

  const rateOptions: FilterButton[] = [
    { label: "3", value: "3" },
    { label: "3.5", value: "3.5" },
    { label: "4", value: "4" },
    { label: "4.5", value: "4.5" },
    { label: "5", value: "5" },
    { label: "R", value: "R" },
  ];

  const transmissionOptions: FilterButton[] = [
    { label: "AT", value: "AT" },
    { label: "FAT", value: "FAT" },
    { label: "IAT", value: "IAT" },
    { label: "CVT", value: "CVT" },
    { label: "MT", value: "MT" },
  ];

  const statusOptions: FilterButton[] = [
    { label: "продан", value: "sold" },
    { label: "не продан", value: "not_sold" },
  ];

  const sanctionOptions: FilterButton[] = [
    { label: "санкционный", value: "1" },
    { label: "без санкций", value: "0" },
  ];

  const handDriveOptions: FilterButton[] = [
    { label: "LHD", value: "1" },
    { label: "RHD", value: "0" },
  ];

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
    setDrive(params.get("drive") || "");
    setColor(params.get("color") || "");
    setStatus(params.get("status") || "");
    setBody(params.get("body") || "");
    setSanction(params.get("sanction") || "");
    setLeftHandDrive(params.get("leftHandDrive") || "");
    setSort(params.get("sort") || "");
    setPage(Number(params.get("page") || 1) || 1);
    setAdvancedOpen(Boolean(params.get("auction") || params.get("rateFrom") || params.get("color") || params.get("body")));

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
    if (drive) params.set("drive", drive);
    if (color) params.set("color", color);
    if (status) params.set("status", status);
    if (body) params.set("body", body);
    if (sanction) params.set("sanction", sanction);
    if (leftHandDrive) params.set("leftHandDrive", leftHandDrive);
    if (sort) params.set("sort", sort);

    params.set("page", String(page));
    params.set("limit", "24");

    const query = params.toString();
    window.history.replaceState(null, "", `/catalog?${query}`);

    setLoading(true);
    setError("");

    fetch(`/api/catalog?${query}`, { cache: "no-store" })
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
    drive,
    color,
    status,
    body,
    sanction,
    leftHandDrive,
    sort,
    page,
  ]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQ(qDraft.trim());
  }

  function setFilter(action: () => void) {
    setPage(1);
    action();
  }

  function toggle(current: string, value: string, setter: (next: string) => void) {
    setFilter(() => setter(current === value ? "" : value));
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
    setDrive("");
    setColor("");
    setStatus("");
    setBody("");
    setSanction("");
    setLeftHandDrive("");
    setSort("");
    setPage(1);
    setAdvancedOpen(false);
  }

  const activeFiltersCount = [
    brand,
    model,
    q,
    yearFrom,
    yearTo,
    mileageTo,
    auction,
    rateFrom,
    transmission,
    drive,
    color,
    status,
    body,
    sanction,
    leftHandDrive,
    sort,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-[#07152f] px-4 py-2 text-sm font-black uppercase text-white hover:bg-[#d8001f]"
            >
              Начало
            </Link>

            <div className="hidden text-sm font-black text-slate-500 md:block">
              TOKYO <span className="text-slate-950">{tokyoTime()}</span>
            </div>

            <div className="truncate text-sm font-black text-blue-700">
              {formatNumber(total)} авто из Японии
            </div>
          </div>

          <div className="hidden items-center gap-2 xl:flex">
            <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-black ring-1 ring-slate-100">
              ЦБ · 100 JPY {formatRateValue(rates?.currencies?.JPY?.value)} ₽
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-black ring-1 ring-slate-100">
              ЦБ · 1 CNY {formatRateValue(rates?.currencies?.CNY?.value)} ₽
            </div>
          </div>

          <Link
            href="/"
            className="rounded-xl bg-white px-4 py-2 text-sm font-black text-[#07152f] ring-1 ring-slate-200 hover:bg-slate-50"
          >
            На главную
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1800px] px-4 py-4">
        <form
          onSubmit={submitSearch}
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="grid gap-3 xl:grid-cols-[1fr_1fr_150px_130px_130px_150px_160px_120px]">
            <SelectField
              label="Марка"
              value={brand}
              disabled={loadingFilters}
              onChange={(value) => setFilter(() => setBrand(value))}
              options={brands}
              emptyLabel="Любая марка"
            />

            <SelectField
              label="Модель"
              value={model}
              disabled={!brand || models.length === 0}
              onChange={(value) => setFilter(() => setModel(value))}
              options={models}
              emptyLabel="Любая модель"
            />

            <TextField
              label="Номер лота"
              value={qDraft}
              placeholder="Напр. 60246"
              onChange={setQDraft}
            />

            <SelectField
              label="Год от"
              value={yearFrom}
              onChange={(value) => setFilter(() => setYearFrom(value))}
              options={years}
              emptyLabel="От"
              compact
            />

            <SelectField
              label="Год до"
              value={yearTo}
              onChange={(value) => setFilter(() => setYearTo(value))}
              options={years}
              emptyLabel="До"
              compact
            />

            <TextField
              label="Пробег до"
              value={mileageTo}
              placeholder="км"
              onChange={(value) => setFilter(() => setMileageTo(value.replace(/\D/g, "")))}
            />

            <SelectNative
              label="Сортировка"
              value={sort}
              onChange={(value) => setFilter(() => setSort(value))}
              options={[
                ["", "По дате аукциона"],
                ["year_desc", "Год ↓"],
                ["year_asc", "Год ↑"],
                ["mileage_asc", "Пробег ↑"],
                ["mileage_desc", "Пробег ↓"],
                ["price_asc", "Цена ↑"],
                ["price_desc", "Цена ↓"],
              ]}
            />

            <div className="flex items-end">
              <button
                type="submit"
                className="h-11 w-full rounded-2xl bg-gradient-to-b from-[#61b7ff] to-[#2f80ed] text-sm font-black uppercase tracking-[0.14em] text-white shadow-sm hover:brightness-105"
              >
                Поиск
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAdvancedOpen((value) => !value)}
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-200"
              >
                {advancedOpen ? "Скрыть фильтры" : "Расширенные фильтры"}
              </button>

              {activeFiltersCount > 0 && (
                <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
                  Активно: {activeFiltersCount}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={reset}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Сбросить всё
            </button>
          </div>

          {advancedOpen && (
            <div className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-4 lg:grid-cols-2 xl:grid-cols-4">
              <FilterGroup title="Кузов" items={bodyOptions} active={body} onPick={(value) => toggle(body, value, setBody)} />
              <FilterGroup title="Оценка" items={rateOptions} active={rateFrom} onPick={(value) => toggle(rateFrom, value, setRateFrom)} />
              <FilterGroup title="КПП" items={transmissionOptions} active={transmission} onPick={(value) => toggle(transmission, value, setTransmission)} />
              <FilterGroup title="Статус" items={statusOptions} active={status} onPick={(value) => toggle(status, value, setStatus)} />
              <FilterGroup title="Аукцион" items={auctions} active={auction} onPick={(value) => toggle(auction, value, setAuction)} />
              <FilterGroup title="Цвет" items={colors} active={color} onPick={(value) => toggle(color, value, setColor)} />
              <FilterGroup title="Привод" items={drives.length ? drives : [{ label: "FF", value: "FF" }, { label: "FR", value: "FR" }, { label: "4WD", value: "4WD" }]} active={drive} onPick={(value) => toggle(drive, value, setDrive)} />
              <FilterGroup title="Санкции" items={sanctionOptions} active={sanction} onPick={(value) => toggle(sanction, value, setSanction)} />
              <FilterGroup title="Руль" items={handDriveOptions} active={leftHandDrive} onPick={(value) => toggle(leftHandDrive, value, setLeftHandDrive)} />
            </div>
          )}
        </form>

        <div className="mt-4 rounded-2xl bg-[#fff5cc] px-4 py-3 text-sm font-black uppercase tracking-[0.04em] text-[#9a1b1b]">
          Войдите, чтобы видеть всю информацию по лоту
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-black text-slate-950">
              {formatNumber(total)} найдено
            </div>
            <div className="mt-1 text-sm font-bold text-slate-500">
              {brand || "все марки"}{model ? ` · ${model}` : ""}
            </div>
          </div>

          <Pagination page={page} pages={pages} loading={loading} setPage={setPage} />
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-4 grid gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="text-2xl font-black">Лоты не найдены</div>
            <button
              type="button"
              onClick={reset}
              className="mt-4 rounded-2xl bg-[#d8001f] px-5 py-3 font-black text-white"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <CatalogTable cars={cars} />
        )}
      </section>
    </main>
  );
}

function CatalogTable({ cars }: { cars: Car[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase tracking-[0.04em] text-slate-500">
              <Th>Фото</Th>
              <Th>Лот</Th>
              <Th>Аукцион</Th>
              <Th>Автомобиль</Th>
              <Th>Характеристики</Th>
              <Th>Пробег / Оценка</Th>
              <Th>Цены</Th>
              <Th>Действие</Th>
            </tr>
          </thead>

          <tbody>
            {cars.map((car, index) => {
              const images = carImages(car).slice(0, 3);
              const title = `${car.brand || "AUTO"} ${car.model || ""}`.trim();

              return (
                <tr
                  key={car.id || `${car.lot}-${index}`}
                  className={index % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                >
                  <td className="border-t border-slate-100 p-3 align-top">
                    <Link href={`/catalog/${car.id}`} className="flex gap-2">
                      {(images.length ? images : [firstImage(car)]).map((image) => (
                        <img
                          key={image}
                          src={image}
                          alt={title}
                          className="h-20 w-28 rounded-xl object-cover ring-1 ring-slate-200"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = "/mosaic/car-placeholder.png";
                          }}
                        />
                      ))}
                    </Link>
                  </td>

                  <td className="border-t border-slate-100 p-3 align-top">
                    <Link
                      href={`/catalog/${car.id}`}
                      className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-lg font-black text-[#b24a1b] shadow-sm hover:border-[#d8001f]"
                    >
                      {car.lot || "—"}
                    </Link>
                    <div className="mt-2 text-xs text-slate-400">☆ ☆ ☆ ☆ ☆</div>
                  </td>

                  <td className="border-t border-slate-100 p-3 align-top">
                    <div className="font-bold text-slate-900">{car.auctionDate || "—"}</div>
                    <div className="mt-1 font-black text-slate-950">{car.auction || "—"}</div>
                    <div className="mt-2 text-xs font-bold text-slate-500">{statusLabel(car.status)}</div>
                  </td>

                  <td className="border-t border-slate-100 p-3 align-top">
                    <div className="font-black text-slate-950">
                      <span className="text-[#d8001f]">{car.year || "—"}</span>{" "}
                      {cleanText(car.body) || "—"}
                    </div>
                    <div className="mt-1 text-base font-black text-slate-950">{title}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {isSanction(car) && <Badge>санкц.</Badge>}
                      {car.leftHandDrive && <Badge>LHD</Badge>}
                    </div>
                  </td>

                  <td className="border-t border-slate-100 p-3 align-top">
                    <div>
                      <span className="font-black text-[#d8001f]">{cleanText(car.transmission) || "—"}</span>{" "}
                      {formatNumber(car.engineVolume)} cc
                    </div>
                    <div className="mt-1 text-slate-500">
                      {cleanText(car.color) || "—"} {cleanText(car.drive)}
                    </div>
                  </td>

                  <td className="border-t border-slate-100 p-3 align-top">
                    <div className="font-bold">{formatNumber(car.mileage)} км</div>
                    <div className="mt-1 font-black text-amber-600">▲ {cleanText(car.rate || car.grade) || "—"}</div>
                  </td>

                  <td className="border-t border-slate-100 p-3 align-top text-right">
                    <div className="text-slate-500">Старт: {formatPrice(car.startPrice)}</div>
                    <div className="mt-1 text-slate-950">Продано: {formatPrice(car.finishPrice)}</div>
                    <div className="mt-2 text-lg font-black text-green-700">{formatPrice(car.averagePrice)}</div>
                  </td>

                  <td className="border-t border-slate-100 p-3 align-top text-right">
                    <Link
                      href={`/catalog/${car.id}`}
                      className="inline-flex rounded-xl bg-[#07152f] px-5 py-3 text-sm font-black text-white hover:bg-[#d8001f]"
                    >
                      Открыть
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  disabled,
  onChange,
  options,
  emptyLabel,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: Option[];
  emptyLabel: string;
  compact?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
      >
        <option value="">{emptyLabel}</option>
        {options.map((item) => {
          const value = optionValue(item);
          return (
            <option key={`${label}-${value}`} value={value}>
              {optionLabel(item)} {item.count ? `— ${formatNumber(item.count)}` : ""}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function SelectNative({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500"
      >
        {options.map(([optionValue, label]) => (
          <option key={optionValue || "empty"} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500"
      />
    </label>
  );
}

function FilterGroup({
  title,
  items,
  active,
  onPick,
}: {
  title: string;
  items: FilterButton[];
  active: string;
  onPick: (value: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div>
      <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const selected = active === item.value;

          return (
            <button
              key={`${title}-${item.value}`}
              type="button"
              onClick={() => onPick(item.value)}
              className={`rounded-xl px-3 py-2 text-xs font-black ring-1 ${
                selected
                  ? "bg-[#07152f] text-white ring-[#07152f]"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Pagination({
  page,
  pages,
  loading,
  setPage,
}: {
  page: number;
  pages: number;
  loading: boolean;
  setPage: (value: number | ((current: number) => number)) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={page <= 1 || loading}
        onClick={() => setPage((current) => Math.max(1, current - 1))}
        className="rounded-2xl bg-white px-4 py-2 font-black ring-1 ring-slate-200 disabled:opacity-40"
      >
        ←
      </button>

      <div className="rounded-2xl bg-white px-4 py-2 font-black ring-1 ring-slate-200">
        стр. {page} из {formatNumber(pages)}
      </div>

      <button
        disabled={page >= pages || loading}
        onClick={() => setPage((current) => Math.min(pages, current + 1))}
        className="rounded-2xl bg-white px-4 py-2 font-black ring-1 ring-slate-200 disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-slate-200 px-3 py-3 text-left font-black">
      {children}
    </th>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">
      {children}
    </span>
  );
}
