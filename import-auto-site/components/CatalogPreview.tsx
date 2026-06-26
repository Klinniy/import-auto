"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type CarImage = {
  original?: string;
  preview?: string;
  medium?: string;
};

type Car = {
  id: string;
  lot?: string;
  brand?: string;
  model?: string;
  year?: number | string;
  auction?: string;
  grade?: string | number;
  rate?: string | number;
  mileage?: number | string;
  engineVolume?: number | string;
  previewImage?: string;
  images?: Array<string | CarImage>;
};

function getCars(payload: unknown): Car[] {
  if (Array.isArray(payload)) return payload as Car[];

  if (payload && typeof payload === "object") {
    const obj = payload as {
      items?: unknown;
      data?: unknown;
      cars?: unknown;
      result?: unknown;
    };

    if (Array.isArray(obj.items)) return obj.items as Car[];
    if (Array.isArray(obj.data)) return obj.data as Car[];
    if (Array.isArray(obj.cars)) return obj.cars as Car[];
    if (Array.isArray(obj.result)) return obj.result as Car[];
  }

  return [];
}

function imageOf(car: Car) {
  if (Array.isArray(car.images) && car.images.length > 0) {
    const first = car.images[0];

    if (typeof first === "string") return first;

    return first.medium || first.preview || first.original || car.previewImage || "";
  }

  return car.previewImage || "";
}

function formatNumber(value?: number | string) {
  if (value === undefined || value === null || value === "") return "—";

  const n = Number(value);

  if (!Number.isFinite(n)) return String(value);

  return new Intl.NumberFormat("ru-RU").format(n);
}

export default function CatalogPreview() {
  const [cars, setCars] = useState<Car[] | null>(null);

  useEffect(() => {
    let ignore = false;

    fetch("/api/catalog?page=1&limit=3", { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (!ignore) {
          setCars(getCars(payload).slice(0, 3));
        }
      })
      .catch(() => {
        if (!ignore) setCars([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section id="catalog" className="py-20">
      <div className="mosaic-shell">
        <div className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.24em] text-[#ff2d3d]">
              живой каталог
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#07152f] md:text-5xl">
              Актуальные лоты из Японии
            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Каталог уже подключен к API: показываем реальные автомобили, фото,
              год, пробег, оценку и аукцион. Полный список доступен на отдельной
              странице каталога.
            </p>
          </div>

          <Link
            href="/catalog"
            className="inline-flex w-fit rounded-2xl bg-[#ff2d3d] px-8 py-4 font-black text-white shadow-lg shadow-red-200 transition hover:bg-[#e51d2d]"
          >
            Открыть каталог →
          </Link>
        </div>

        {cars === null ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[390px] animate-pulse rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200"
              />
            ))}
          </div>
        ) : cars.length === 0 ? (
          <div className="mosaic-card rounded-[2rem] p-10 text-center">
            <div className="text-2xl font-black text-[#07152f]">
              Лоты временно не загрузились
            </div>
            <p className="mt-3 text-slate-600">
              Каталог доступен по кнопке ниже, а этот блок обновится после ответа API.
            </p>

            <Link
              href="/catalog"
              className="mt-6 inline-flex rounded-2xl bg-[#ff2d3d] px-8 py-4 font-black text-white"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {cars.map((car) => {
              const image = imageOf(car);
              const title = `${car.brand || "AUTO"} ${car.model || ""}`.trim();

              return (
                <Link
                  key={car.id}
                  href={`/catalog/${car.id}`}
                  className="group overflow-hidden rounded-[2rem] bg-white text-[#07152f] shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative h-64 overflow-hidden bg-slate-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={title}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">
                        🚗
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-[#07152f] shadow-sm backdrop-blur">
                      {car.auction || "Аукцион"}
                    </div>

                    {(car.grade || car.rate) && (
                      <div className="absolute bottom-4 left-4 rounded-full bg-[#ff2d3d] px-3 py-1 text-xs font-black text-white shadow-sm">
                        Оценка {car.grade || car.rate}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black leading-tight">{title}</h3>
                        <div className="mt-1 text-sm font-bold text-slate-500">
                          Лот {car.lot || car.id}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black">
                        {car.year || "—"}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-slate-400">Пробег</div>
                        <b>{formatNumber(car.mileage)} км</b>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="text-slate-400">Объем</div>
                        <b>{formatNumber(car.engineVolume)} см³</b>
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
  );
}
