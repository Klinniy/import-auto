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

type FilterButton = {
  label: string;
  value: string;
};

const ANY_VALUE = "__any__";

type FacetItem = {
  value: string;
  label: string;
  count?: number;
};

type FacetsPayload = {
  ok?: boolean;
  facets?: {
    bodies?: FacetItem[];
    rates?: FacetItem[];
    auctions?: FacetItem[];
    colors?: FacetItem[];
    statuses?: FacetItem[];
    transmissions?: FacetItem[];
    drives?: FacetItem[];
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

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function badFilterValue(value: unknown) {
  const text = String(value ?? "").toLowerCase().trim();

  return (
    !text ||
    text.includes("actual vehicle") ||
    text.includes("vehicle") ||
    text.includes("http") ||
    text.includes("&#") ||
    text.includes("{") ||
    text.length > 28
  );
}

function formatNumber(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return "—";

  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);

  return new Intl.NumberFormat("ru-RU").format(n);
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
        result.push(item.preview || item.medium || item.original || "");
      }
    }
  } else if (car.images && typeof car.images === "object") {
    result.push(car.images.preview || car.images.medium || car.images.original || "");
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

  if (!text) return "";
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

function optionButtons(options: Option[], limit = 8): FilterButton[] {
  return options
    .map((item) => ({
      label: cleanText(optionLabel(item)),
      value: cleanText(optionValue(item)),
    }))
    .filter((item) => item.label && item.value)
    .filter((item) => !badFilterValue(item.label) && !badFilterValue(item.value))
    .slice(0, limit);
}

function facetButtons(items?: FacetItem[], limit = 8): FilterButton[] {
  return (items || [])
    .map((item) => {
      const value = cleanText(item.value);
      const label = cleanText(item.label || item.value);
      const count = Number(item.count || 0);

      return {
        value,
        label: count > 0 ? `${label} — ${formatNumber(count)}` : label,
      };
    })
    .filter((item) => item.label && item.value)
    .filter((item) => !badFilterValue(item.label) && !badFilterValue(item.value))
    .slice(0, limit);
}

export default function CatalogFull() {
  const [initialized, setInitialized] = useState(false);

  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [facets, setFacets] = useState<FacetsPayload | null>(null);
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

  const auctions = useMemo(() => optionButtons(filters?.filters?.auctions || [], 8), [filters]);
  const colors = useMemo(() => optionButtons(filters?.filters?.colors || [], 8), [filters]);
  const drives = useMemo(() => optionButtons(filters?.filters?.drives || [], 6), [filters]);

  const facetBodies = useMemo(() => facetButtons(facets?.facets?.bodies, 7), [facets]);
  const facetRates = useMemo(() => facetButtons(facets?.facets?.rates, 7), [facets]);
  const facetAuctions = useMemo(() => facetButtons(facets?.facets?.auctions, 7), [facets]);
  const facetColors = useMemo(() => facetButtons(facets?.facets?.colors, 7), [facets]);
  const facetStatuses = useMemo(() => facetButtons(facets?.facets?.statuses, 5), [facets]);
  const facetTransmissions = useMemo(() => facetButtons(facets?.facets?.transmissions, 7), [facets]);

  const bodyOptions: FilterButton[] = [
    { label: "GJ2", value: "GJ2" },
    { label: "GJ1", value: "GJ1" },
    { label: "FE0", value: "FE0" },
    { label: "NCP", value: "NCP" },
    { label: "ZVW", value: "ZVW" },
  ];

  const rateOptions: FilterButton[] = [
    { label: "4", value: "4" },
    { label: "3.5", value: "3.5" },
    { label: "R", value: "R" },
  ];

  const transmissionOptions: FilterButton[] = [
    { label: "AT", value: "AT" },
    { label: "FAT", value: "FAT" },
    { label: "IAT", value: "IAT" },
    { label: "CVT", value: "CVT" },
    { label: "MT", value: "MT" },
  ];

  const canSearch = Boolean(brand && model);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const initialBrand = params.get("brand") || "";
    const initialModel = params.get("model") || (initialBrand ? ANY_VALUE : "");

    setBrand(initialBrand);
    setModel(initialModel);
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

    setInitialized(true);
  }, []);

  useEffect(() => {
    setLoadingFilters(true);

    fetch("/api/filters", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => setFilters(payload))
      .catch(() => setFilters(null))
      .finally(() => setLoadingFilters(false));
  }, []);

  useEffect(() => {
    if (!brand) {
      setModels([]);
      setModel("");
      return;
    }

    if (brand === ANY_VALUE) {
      setModels([]);
      setModel(ANY_VALUE);
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

    const apiParams = new URLSearchParams(params);

    if (apiParams.get("brand") === ANY_VALUE) apiParams.delete("brand");
    if (apiParams.get("model") === ANY_VALUE) apiParams.delete("model");

    const query = params.toString();
    const apiQuery = apiParams.toString();

    window.history.replaceState(null, "", `/catalog?${query}`);

    if (!canSearch) {
      setCars([]);
      setTotal(0);
      setPages(1);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    fetch(`/api/catalog?${apiQuery}`, { cache: "no-store" })
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

    if (!canSearch) {
      setFacets(null);
      return;
    }

    const apiParams = new URLSearchParams(params);

    if (apiParams.get("brand") === ANY_VALUE) apiParams.delete("brand");
    if (apiParams.get("model") === ANY_VALUE) apiParams.delete("model");

    fetch(`/api/catalog/facets?${apiParams.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: FacetsPayload) => setFacets(payload?.ok ? payload : null))
      .catch(() => setFacets(null));
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
  }

  function resetOnlyFilters() {
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
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[12px] text-black">
      <div className="border-b border-[#d9d9d9] bg-[#f7f7f7]">
        <div className="flex h-[34px] items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-sm bg-[#dfe8f3] px-2 py-[2px] text-[12px] font-bold text-[#3d516b]"
            >
              Начало
            </Link>
            <span className="font-bold text-[#5a6d80]">TOKYO</span>
            <span className="font-bold">{tokyoTime()}</span>
            <span className="font-bold text-[#1155cc]">{formatNumber(total)} авто из Японии</span>
          </div>

          <Link
            href="/"
            className="rounded-sm bg-[#07152f] px-5 py-2 text-[12px] font-bold text-white"
          >
            На главную
          </Link>
        </div>
      </div>

      <section className="flex">
        <aside className="w-[42px] shrink-0 bg-[#f4f7fb] pt-2 text-center text-[10px] font-bold text-[#53667c]">
          {["CS", "BC", "ПП", "BT", "CP", "☝", "100", "LHD"].map((item) => (
            <button
              key={item}
              type="button"
              className={`mb-1 block h-[26px] w-full ${
                item === "100" ? "bg-[#dff5a7] text-[#4e8a00]" : ""
              }`}
              onClick={() => {
                if (item === "100") toggle(sanction, "0", setSanction);
                if (item === "LHD") toggle(leftHandDrive, "1", setLeftHandDrive);
              }}
            >
              {item}
            </button>
          ))}
        </aside>

        <div className="min-w-0 flex-1">
          <form
            onSubmit={submitSearch}
            className="mx-2 mt-2 rounded-sm border border-[#d7dce3] bg-[#f6f7f9] p-1.5"
          >
            <div className="grid grid-cols-[260px_260px_180px_90px_90px_125px_135px_100px_80px] gap-x-2">
              <AfaSelectList
                title="Марка"
                value={brand}
                disabled={loadingFilters}
                options={brands}
                emptyLabel="Выберите"
                onChange={(value) => setFilter(() => {
                  setBrand(value);
                  setModel(value === ANY_VALUE ? ANY_VALUE : "");
                })}
              />

              <AfaSelectList
                title="Модель"
                value={model}
                disabled={!brand}
                options={models}
                emptyLabel="Выберите"
                onChange={(value) => setFilter(() => setModel(value))}
              />

              <div>
                <AfaTitle>Параметры</AfaTitle>

                <input
                  value={qDraft}
                  onChange={(event) => setQDraft(event.target.value)}
                  placeholder="Номер лота"
                  className="mb-[5px] h-[25px] w-full border border-[#c7d0da] px-2 text-[12px]"
                />

                <div className="mb-[5px] grid grid-cols-2 gap-1">
                  <select
                    value={yearFrom}
                    onChange={(event) => setFilter(() => setYearFrom(event.target.value))}
                    className="h-[25px] border border-[#c7d0da] text-[12px]"
                  >
                    <option value="">Год от</option>
                    {years.map((item) => {
                      const value = optionValue(item);
                      return <option key={`yf-${value}`} value={value}>{value}</option>;
                    })}
                  </select>

                  <select
                    value={yearTo}
                    onChange={(event) => setFilter(() => setYearTo(event.target.value))}
                    className="h-[25px] border border-[#c7d0da] text-[12px]"
                  >
                    <option value="">Год до</option>
                    {years.map((item) => {
                      const value = optionValue(item);
                      return <option key={`yt-${value}`} value={value}>{value}</option>;
                    })}
                  </select>
                </div>

                <input
                  value={mileageTo}
                  onChange={(event) => setFilter(() => setMileageTo(event.target.value.replace(/\D/g, "")))}
                  placeholder="Пробег до, км"
                  className="mb-[5px] h-[25px] w-full border border-[#c7d0da] px-2 text-[12px]"
                />

                <button
                  type="submit"
                  className="mb-[5px] h-[28px] w-full rounded-sm bg-gradient-to-b from-[#6fbaff] to-[#2f80ed] text-[13px] font-bold uppercase tracking-[0.16em] text-white"
                >
                  Поиск
                </button>

                <button
                  type="button"
                  onClick={reset}
                  className="mb-[5px] h-[25px] w-full border border-[#c7d0da] bg-white text-[12px] font-bold uppercase tracking-[0.16em] text-[#687789]"
                >
                  Сброс
                </button>

                <button
                  type="button"
                  className="text-left text-[12px] font-bold uppercase tracking-[0.16em] text-[#d96f13]"
                >
                  Расширенный поиск
                </button>

                <button
                  type="button"
                  onClick={resetOnlyFilters}
                  className="mt-[4px] text-left text-[12px] font-bold uppercase tracking-[0.12em] text-[#2f6fad]"
                >
                  Сброс фильтров
                </button>
              </div>

              <AfaCheckList title="Кузов" items={facetBodies.length ? facetBodies : bodyOptions} active={body} onPick={(value) => toggle(body, value, setBody)} />
              <AfaCheckList title="Оценка" items={facetRates.length ? facetRates : rateOptions} active={rateFrom} onPick={(value) => toggle(rateFrom, value, setRateFrom)} />
              <AfaCheckList title="Аукцион" items={facetAuctions.length ? facetAuctions : auctions} active={auction} onPick={(value) => toggle(auction, value, setAuction)} />
              <AfaCheckList title="Цвета" items={facetColors.length ? facetColors : colors} active={color} onPick={(value) => toggle(color, value, setColor)} />
              <AfaCheckList title="Статус" items={facetStatuses.length ? facetStatuses : [
                { label: "не продан", value: "not_sold" },
                { label: "продан", value: "sold" },
              ]} active={status} onPick={(value) => toggle(status, value, setStatus)} />
              <AfaCheckList title="КПП" items={facetTransmissions.length ? facetTransmissions : transmissionOptions} active={transmission} onPick={(value) => toggle(transmission, value, setTransmission)} />
            </div>
          </form>

          <div className="mx-2 mt-2 bg-[#fff6c9] px-3 py-[5px] text-[12px] font-bold uppercase tracking-[0.08em] text-[#9d1b1b]">
            Войдите, чтобы видеть всю информацию по лоту
          </div>

          <div className="mx-2 mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-[14px] font-bold">
                <span className="text-[#498000]">{formatNumber(total)}</span>{" "}
                найдено · {brand || "все марки"}{model ? ` · ${model}` : ""}
              </div>

              <div className="flex items-center gap-[3px] text-[11px]">
                {["List A", "B", "C", "D", "Статистика"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-sm border border-[#d5dce6] bg-[#eef2f6] px-2 py-[2px] font-bold text-[#42628a]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <AfaPager page={page} pages={pages} loading={loading} setPage={setPage} />
          </div>

          {error && (
            <div className="mx-2 mt-2 border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {!canSearch ? (
            <div className="mx-2 mt-3 bg-[#f3f3f3] p-8 text-center text-[14px] font-bold">
              Выберите марку и модель. Для полного поиска выберите «Любая» в марке и модели.
            </div>
          ) : loading ? (
            <div className="mx-2 mt-3 text-center text-[14px] font-bold">
              Загружаем лоты...
            </div>
          ) : (
            <AfaTable cars={cars} />
          )}
        </div>
      </section>
    </main>
  );
}

function AfaTable({ cars }: { cars: Car[] }) {
  if (!cars.length) {
    return (
      <div className="mx-2 mt-3 bg-[#f3f3f3] p-8 text-center text-[14px] font-bold">
        Лоты не найдены
      </div>
    );
  }

  return (
    <div className="mx-2 mt-2 overflow-hidden">
      <table className="w-full table-fixed border-collapse text-[10.5px]">
        <thead>
          <tr className="bg-gradient-to-b from-white to-[#eef2f6] text-[#314154]">
            <AfaTh>Фото ↑</AfaTh>
            <AfaTh>Номер лота ↑</AfaTh>
            <AfaTh>Дата аукцион / Аукцион ↑</AfaTh>
            <AfaTh>Год / Кузов ↑</AfaTh>
            <AfaTh>Объем, см³ / Комплектация ↑</AfaTh>
            <AfaTh>Пробег / Оценка ↑</AfaTh>
            <AfaTh>Начальная / Продано за ↑</AfaTh>
            <AfaTh>Средняя цена ↑</AfaTh>
          </tr>
        </thead>

        <tbody>
          {cars.map((car, index) => {
            const images = carImages(car).slice(0, 3);
            const title = `${car.brand || "AUTO"} ${car.model || ""}`.trim();

            return (
              <tr
                key={car.id || `${car.lot}-${index}`}
                className={index % 2 === 0 ? "bg-white" : "bg-[#eeeeee]"}
              >
                <td className="border-b border-white px-1 py-[4px] align-top">
                  <Link href={`/catalog/${car.id}`} className="flex gap-[3px]">
                    {(images.length ? images : [firstImage(car)]).map((image) => (
                      <img
                        key={image}
                        src={image}
                        alt={title}
                        loading="lazy"
                        className="h-[50px] w-[66px] object-cover"
                        onError={(event) => {
                          event.currentTarget.src = "/mosaic/car-placeholder.png";
                        }}
                      />
                    ))}
                  </Link>
                </td>

                <td className="border-b border-white px-1.5 py-[5px] text-center align-top">
                  <Link
                    href={`/catalog/${car.id}`}
                    className="inline-block min-w-[58px] rounded-sm border border-[#cfd6df] bg-white px-3 py-[6px] text-[14px] font-bold text-[#bf4d22]"
                  >
                    {car.lot || "—"}
                  </Link>
                  <div className="mt-[4px] text-[10px] tracking-[2px] text-[#a9b5c2]">
                    ☆☆☆☆☆
                  </div>
                </td>

                <td className="border-b border-white px-1.5 py-[5px] text-center align-top">
                  <div>{car.auctionDate || "—"}</div>
                  <div className="font-bold">{car.auction || "—"}</div>
                </td>

                <td className="border-b border-white px-1.5 py-[5px] align-top">
                  <div>
                    <span className="font-bold text-[#c52b16]">{car.year || "—"}</span>{" "}
                    {cleanText(car.body) || "—"}
                  </div>
                  <div className="mt-[4px] font-bold uppercase">{title}</div>
                </td>

                <td className="border-b border-white px-1.5 py-[5px] align-top">
                  <div>
                    <span className="font-bold text-[#c52b16]">
                      {cleanText(car.transmission) || "—"}
                    </span>{" "}
                    {formatNumber(car.engineVolume)} cc
                  </div>
                  <div className="mt-[4px] text-[#66758a]">
                    {cleanText(car.color) || "—"} {cleanText(car.drive)}
                  </div>
                </td>

                <td className="border-b border-white px-1.5 py-[5px] text-center align-top">
                  <div>{formatNumber(car.mileage)} km</div>
                  <div className="mt-[4px] font-bold text-[#b78300]">
                    ▲ {cleanText(car.rate || car.grade) || "—"}
                  </div>
                </td>

                <td className="border-b border-white px-1.5 py-[5px] text-right align-top">
                  <div>{formatPrice(car.startPrice)}</div>
                  <div className="mt-[4px]">{formatPrice(car.finishPrice)}</div>
                  <div className="mt-[4px] text-[10px] text-[#4d6680]">
                    {isSanction(car) ? "санкц." : statusLabel(car.status)}
                  </div>
                </td>

                <td className="border-b border-white px-1.5 py-[5px] text-right align-top">
                  <div className="font-bold text-[#008000]">
                    {formatPrice(car.averagePrice)}
                  </div>

                  <Link
                    href={`/catalog/${car.id}`}
                    className="mt-[6px] inline-block rounded-sm border border-[#07152f] bg-white px-3 py-[5px] text-[10.5px] font-bold text-[#07152f]"
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
  );
}

function AfaSelectList({
  title,
  value,
  disabled,
  options,
  emptyLabel,
  onChange,
}: {
  title: string;
  value: string;
  disabled?: boolean;
  options: Option[];
  emptyLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <AfaTitle>{title}</AfaTitle>

      <select
        value={value}
        disabled={disabled}
        size={9}
        onChange={(event) => onChange(event.target.value)}
        className="h-[158px] w-full border border-[#c9d1db] bg-white px-1 text-[12px] font-bold disabled:bg-[#eeeeee] disabled:text-[#999999]"
      >
        <option value="">{emptyLabel}</option>
        <option value={ANY_VALUE}>Любая</option>
        {options.map((item) => {
          const value = optionValue(item);

          return (
            <option key={`${title}-${value}`} value={value}>
              {optionLabel(item)} {item.count ? `— ${formatNumber(item.count)}` : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function AfaCheckList({
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
  const [open, setOpen] = useState(false);
  const visible = items.slice(0, 6);
  const hiddenCount = Math.max(0, items.length - visible.length);

  function renderItem(item: FilterButton) {
    const selected = active === item.value;

    return (
      <button
        key={`${title}-${item.value}`}
        type="button"
        onClick={() => {
          onPick(item.value);
          setOpen(false);
        }}
        className={`flex min-w-0 items-center gap-[3px] text-left text-[12px] leading-[14px] ${
          selected ? "font-bold text-[#0b5cad]" : ""
        }`}
      >
        <span
          className={`h-[7px] w-[7px] shrink-0 border border-[#8fa0b3] ${
            selected ? "bg-[#2f80ed]" : "bg-white"
          }`}
        />
        <span className="truncate">{item.label}</span>
      </button>
    );
  }

  return (
    <div className="relative min-w-0">
      <AfaTitle>{title}</AfaTitle>

      <div className="grid gap-[5px]">
        {visible.map(renderItem)}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="mt-[2px] text-left text-[11px] font-bold text-[#2f6fad]"
          >
            еще {hiddenCount}
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-[280px] w-[260px] overflow-y-auto border border-[#b8c4d2] bg-white p-2 shadow-xl">
          <div className="mb-2 flex items-center justify-between border-b border-[#e3e8ef] pb-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d8001f]">
              {title}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12px] font-bold text-[#777]"
            >
              закрыть
            </button>
          </div>

          <div className="grid gap-[6px]">
            {items.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
}

function AfaPager({
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
    <div className="flex items-center gap-[4px] text-[12px]">
      <button
        type="button"
        disabled={page <= 1 || loading}
        onClick={() => setPage((current) => Math.max(1, current - 1))}
        className="h-[24px] min-w-[34px] rounded-sm bg-[#eef2f6] px-2 font-bold disabled:opacity-40"
      >
        ←
      </button>

      <div className="h-[24px] rounded-sm bg-[#eef2f6] px-4 py-[4px] font-bold">
        List A · стр. {page} из {formatNumber(pages)}
      </div>

      <button
        type="button"
        disabled={page >= pages || loading}
        onClick={() => setPage((current) => Math.min(pages, current + 1))}
        className="h-[24px] min-w-[34px] rounded-sm bg-[#eef2f6] px-2 font-bold disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

function AfaTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[5px] text-[10.5px] font-bold uppercase tracking-[0.35em] text-[#d8001f]">
      {children}
    </div>
  );
}

function AfaTh({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-[#d9dfe7] px-1.5 py-[5px] text-center text-[10.5px] font-bold">
      {children}
    </th>
  );
}
