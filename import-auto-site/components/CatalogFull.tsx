"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Brand = { name: string; count?: number };
type Model = { name: string; count?: number };

type Car = {
  id?: string;
  lot?: string;
  brand?: string;
  model?: string;
  year?: string | number;
  auction?: string;
  auctionDate?: string;
  rate?: string | number;
  grade?: string | number;
  mileage?: number;
  engineVolume?: number;
  transmission?: string;
  drive?: string;
  sanction?: boolean | string | number;
  previewImage?: string;
  images?: string[] | {
    original?: string;
    medium?: string;
    preview?: string;
  };
};

function safeBadge(value: unknown): string {
  const text = String(value ?? "").trim();

  if (!text || text === "-" || text === "—") return "";

  if (
    text.length > 8 ||
    text.includes("http") ||
    text.includes("{") ||
    text.includes("[") ||
    text.includes("#") ||
    text.includes("High ") ||
    text.includes("Low ") ||
    text.includes("Seat ") ||
    text.includes("Package") ||
    text.includes("&w=") ||
    text.includes("&h=")
  ) {
    return "";
  }

  return text;
}

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

function getTotal(payload: unknown, fallback: number) {
  const p = payload as any;
  return p?.total ?? p?.count ?? p?.data?.total ?? p?.data?.count ?? fallback;
}

function num(value?: number) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("ru-RU").format(value);
}

function carImage(car: Car) {
  const fallback = "/mosaic/car-placeholder.png";

  if (Array.isArray(car.images) && car.images.length > 0) {
    const first = car.images[0];

    if (typeof first === "string") {
      return first;
    }

    if (first && typeof first === "object") {
      const image = first as {
        medium?: string;
        original?: string;
        preview?: string;
      };

      return image.medium || image.original || image.preview || car.previewImage || fallback;
    }
  }

  if (car.images && typeof car.images === "object") {
    const image = car.images as {
      medium?: string;
      original?: string;
      preview?: string;
    };

    return image.medium || image.original || image.preview || car.previewImage || fallback;
  }

  return car.previewImage || fallback;
}

function isSanction(car: Car) {
  const v = car.sanction;
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    return ["1", "true", "yes", "да", "y"].includes(v.toLowerCase());
  }
  return false;
}

export default function CatalogFull() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [q, setQ] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [mileageTo, setMileageTo] = useState("");
  const [rateFrom, setRateFrom] = useState("");
  const [auction, setAuction] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/brands")
      .then((r) => r.json())
      .then((p) => setBrands(getArray<Brand>(p)))
      .catch(() => setBrands([]));
  }, []);

  useEffect(() => {
    if (!brand) {
      setModels([]);
      setModel("");
      return;
    }

    fetch(`/api/models?brand=${encodeURIComponent(brand)}`)
      .then((r) => r.json())
      .then((p) => setModels(getArray<Model>(p)))
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

    fetch(`/api/catalog?${params.toString()}`)
      .then((r) => r.json())
      .then((p) => {
        const items = getArray<Car>(p);
        setCars(items);
        setTotal(getTotal(p, items.length));
      })
      .catch(() => {
        setCars([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [brand, model, q, yearFrom, yearTo, mileageTo, rateFrom, auction, page]);

  return (
    <main className="min-h-screen bg-[#0f1115] text-white">
      <header className="sticky top-0 z-50 border-b border-red-900/60 bg-[#111217]/95">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between px-5 py-4">
          <div className="font-black">
            MOSAIC<span className="text-red-500">AUTO</span>
          </div>
          <div className="font-black text-blue-400">{num(total)} авто из Японии</div>
          <Link href="/" className="rounded-xl bg-white px-4 py-2 font-black text-[#07152f]">
            На главную
          </Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-[380px_1fr]">
        <aside className="border-r border-slate-800 bg-[#14161c] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-2xl font-black">Поиск авто</h1>
            <button
              onClick={() => {
                setBrand("");
                setModel("");
                setQ("");
                setYearFrom("");
                setYearTo("");
                setMileageTo("");
                setRateFrom("");
                setAuction("");
                setPage(1);
              }}
              className="text-sm font-black text-yellow-400"
            >
              сброс
            </button>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-slate-700 bg-[#0f1115] p-4">
              <div className="mb-2 text-sm font-black text-slate-400">Марка</div>
              <select
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setModel("");
                  setPage(1);
                }}
                className="h-12 w-full rounded-xl bg-slate-900 px-3 font-bold outline-none ring-1 ring-slate-700"
              >
                <option value="">Любая</option>
                {brands.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}{b.count ? ` (${b.count})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-[#0f1115] p-4">
              <div className="mb-2 text-sm font-black text-slate-400">Модель</div>
              <select
                value={model}
                disabled={!brand}
                onChange={(e) => {
                  setModel(e.target.value);
                  setPage(1);
                }}
                className="h-12 w-full rounded-xl bg-slate-900 px-3 font-bold outline-none ring-1 ring-slate-700 disabled:opacity-40"
              >
                <option value="">Любая</option>
                {models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}{m.count ? ` (${m.count})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <Filter title="Номер лота / кузов / текст" value={q} setValue={setQ} setPage={setPage} />
            <Filter title="Год от" value={yearFrom} setValue={setYearFrom} setPage={setPage} />
            <Filter title="Год до" value={yearTo} setValue={setYearTo} setPage={setPage} />
            <Filter title="Пробег до, тыс.км" value={mileageTo} setValue={setMileageTo} setPage={setPage} />
            <Filter title="Аукцион" value={auction} setValue={setAuction} setPage={setPage} />

            <div className="rounded-2xl border border-slate-700 bg-[#0f1115] p-4">
              <div className="mb-2 text-sm font-black text-slate-400">Оценка от</div>
              <select
                value={rateFrom}
                onChange={(e) => {
                  setRateFrom(e.target.value);
                  setPage(1);
                }}
                className="h-12 w-full rounded-xl bg-slate-900 px-3 font-bold outline-none ring-1 ring-slate-700"
              >
                <option value="">Любая</option>
                <option value="3">3+</option>
                <option value="3.5">3.5+</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
                <option value="5">5+</option>
              </select>
            </div>
          </div>
        </aside>

        <section className="p-5">
          <div className="mb-5 flex items-end justify-between border-b border-slate-800 pb-5">
            <div>
              <div className="text-sm font-bold text-slate-400">Найдено</div>
              <div className="text-4xl font-black">{num(total)} авто</div>
            </div>

            <div className="flex items-center gap-3">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl bg-slate-800 px-4 py-3 font-black disabled:opacity-30">←</button>
              <div className="font-black">стр. {page}</div>
              <button onClick={() => setPage((p) => p + 1)} className="rounded-xl bg-slate-800 px-4 py-3 font-black">→</button>
            </div>
          </div>

          {loading ? (
            <div className="text-xl font-black text-slate-400">Загрузка...</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {cars.map((car, index) => (
                <Link key={car.id || index} href={`/catalog/${car.id || ""}`} className="overflow-hidden rounded-2xl border border-slate-800 bg-[#171a21] shadow-xl">
                  <div className="relative h-56 bg-slate-900">
                    <img src={carImage(car)} alt="" className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3 rounded-lg bg-black/70 px-3 py-1 text-xs font-black">
                      LOT {car.lot || "—"}
                    </div>
                    <div className="absolute right-3 top-3 flex gap-2">
                      {isSanction(car) && (
                        <span className="rounded-lg bg-yellow-400 px-3 py-1 text-xs font-black text-black">САНКЦ.</span>
                      )}
                      {safeBadge(car.rate || car.grade) && (
                <span className="rounded-lg bg-red-500 px-3 py-1 text-xs font-black">
                  {safeBadge(car.rate || car.grade)}
                </span>
              )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-xl font-black">{car.brand || "—"} {car.model || ""}</div>
                    <div className="mt-1 text-sm font-bold text-slate-400">
                      {car.year || "—"} · {car.auction || "аукцион"} · {car.auctionDate || "дата —"}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <Info label="Пробег" value={`${num(car.mileage)} км`} />
                      <Info label="Объем" value={`${num(car.engineVolume)} см³`} />
                      <Info label="КПП" value={car.transmission || "—"} />
                      <Info label="Привод" value={car.drive || "—"} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Filter({
  title,
  value,
  setValue,
  setPage,
}: {
  title: string;
  value: string;
  setValue: (value: string) => void;
  setPage: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-[#0f1115] p-4">
      <div className="mb-2 text-sm font-black text-slate-400">{title}</div>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setPage(1);
        }}
        className="h-12 w-full rounded-xl bg-slate-900 px-3 font-bold outline-none ring-1 ring-slate-700"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900 p-3">
      <div className="text-slate-500">{label}</div>
      <b>{value}</b>
    </div>
  );
}
