"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type CatalogProps = {
  onAuth: () => void;
};

type Car = {
  id: string;
  lot?: string;
  brand?: string;
  model?: string;
  year?: number | string;
  auction?: string;
  grade?: string;
  mileage?: number | string;
  engineVolume?: number | string;
  rate?: string | number;
  previewImage?: string;
  images?: string[];
};

type Filters = {
  brand?: string;
  q?: string;
  yearFrom?: string;
  priceTo?: string;
};

function pickCars(payload: unknown): Car[] {
  if (Array.isArray(payload)) return payload as Car[];

  if (payload && typeof payload === "object") {
    const obj = payload as {
      data?: unknown;
      items?: unknown;
      cars?: unknown;
      result?: unknown;
    };

    if (Array.isArray(obj.data)) return obj.data as Car[];
    if (Array.isArray(obj.items)) return obj.items as Car[];
    if (Array.isArray(obj.cars)) return obj.cars as Car[];
    if (Array.isArray(obj.result)) return obj.result as Car[];
  }

  return [];
}

function formatNumber(value?: number | string) {
  if (value === undefined || value === null || value === "") return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return new Intl.NumberFormat("ru-RU").format(num);
}

function imageOf(car: Car) {
  return car.previewImage || car.images?.[0] || "";
}

export default function Catalog({ onAuth }: CatalogProps) {
  const [cars, setCars] = useState<Car[] | null>(null);
  const [filters, setFilters] = useState<Filters>({});

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "8");
    params.set("page", "1");

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    return params.toString();
  }, [filters]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<Filters>;
      setCars(null);
      setFilters(custom.detail || {});
    };

    window.addEventListener("mosaic-search", handler);
    return () => window.removeEventListener("mosaic-search", handler);
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch(`/api/catalog?${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) setCars(pickCars(data));
      })
      .catch(() => {
        if (!ignore) setCars([]);
      });

    return () => {
      ignore = true;
    };
  }, [query]);

  const isLoading = cars === null;

  return (
    <section id="catalog" className="bg-[#08090d] px-4 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.24em] text-red-300">онлайн каталог</div>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">Актуальные лоты</h2>
            <p className="mt-4 max-w-2xl text-white/55">
              Каталог обращается к /api/catalog. Полная карточка открывается через /api/car/:id.
            </p>
          </div>

          <button
            onClick={() => {
              setCars(null);
              setFilters({});
            }}
            className="w-fit rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white hover:text-black"
          >
            Сбросить поиск
          </button>
        </div>

        {isLoading ? (
          <div className="mt-9 grid gap-5 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[390px] animate-pulse rounded-[2rem] bg-white/8" />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="glass mt-9 rounded-[2rem] p-10 text-center">
            <div className="text-3xl font-black">Лоты не найдены</div>
            <p className="mt-3 text-white/55">Попробуйте изменить марку, год или бюджет.</p>
          </div>
        ) : (
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {cars.map((car) => {
              const image = imageOf(car);

              return (
                <article key={car.id} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
                  <div className="relative h-56 overflow-hidden bg-white/5">
                    {image ? (
                      <Image
                        src={image}
                        alt={`${car.brand || "Автомобиль"} ${car.model || ""}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">🚗</div>
                    )}
                    <div className="absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-xs font-black backdrop-blur">
                      {car.auction || "Аукцион"}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="text-lg font-black">
                      {car.brand || "AUTO"} {car.model || ""}
                    </div>
                    <div className="mt-1 text-sm text-white/45">Лот {car.lot || car.id}</div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/35">Год</div>
                        <b>{car.year || "—"}</b>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/35">Пробег</div>
                        <b>{formatNumber(car.mileage)} км</b>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/35">Оценка</div>
                        <b>{car.rate || car.grade || "—"}</b>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <div className="text-white/35">Объем</div>
                        <b>{formatNumber(car.engineVolume)}</b>
                      </div>
                    </div>

                    <button
                      onClick={onAuth}
                      className="mt-5 w-full rounded-2xl bg-red-600 px-5 py-4 font-black transition hover:bg-red-700"
                    >
                      Получить расчет
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
