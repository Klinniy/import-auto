"use client";

import { useMemo, useState } from "react";
import { cars } from "../data/cars";

type CatalogProps = {
  isLoggedIn: boolean;
};

function rub(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
}

export default function Catalog({ isLoggedIn }: CatalogProps) {
  const [selectedCountry, setSelectedCountry] = useState("Все");

  const countries = useMemo(
    () => ["Все", ...new Set(cars.map((car) => car.country))],
    []
  );

  const filteredCars =
    selectedCountry === "Все"
      ? cars
      : cars.filter((car) => car.country === selectedCountry);

  return (
    <section id="catalog" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Каталог автомобилей
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Боевой каталог будет подтягивать данные из разных источников по
              странам. На макете показана логика разделения.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold ${
                  selectedCountry === country
                    ? "bg-red-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="text-6xl">🔒</div>
            <h3 className="mt-5 text-2xl font-bold">
              Каталог доступен после входа
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Зарегистрируйтесь, чтобы смотреть автомобили из Японии, Китая,
              Кореи, сохранять лоты и отправлять заявки на расчёт.
            </p>
            <a
              href="#auth"
              className="mt-6 inline-flex rounded-2xl bg-red-600 px-6 py-4 font-semibold text-white transition hover:bg-red-700"
            >
              Войти или зарегистрироваться
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {filteredCars.map((car) => (
              <article
                key={car.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex h-56 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-300">
                  <div className="text-center">
                    <div className="text-6xl">🚘</div>
                    <div className="mt-2 text-sm font-semibold text-slate-600">
                      {car.country} · {car.brand} {car.model}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        {car.brand} {car.model}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {car.source} · {car.lot}
                      </p>
                    </div>
                    <span className="rounded-xl bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                      {car.country}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div>
                      Год: <b className="text-slate-950">{car.year}</b>
                    </div>
                    <div>
                      Пробег:{" "}
                      <b className="text-slate-950">
                        {new Intl.NumberFormat("ru-RU").format(car.mileage)} км
                      </b>
                    </div>
                    <div>
                      Двигатель: <b className="text-slate-950">{car.engine}</b>
                    </div>
                    <div>
                      Привод: <b className="text-slate-950">{car.drive}</b>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">
                      Цена в стране покупки
                    </div>
                    <div className="font-bold">{car.foreignPrice}</div>
                    <div className="mt-3 text-sm text-slate-500">
                      Ориентир под ключ
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {rub(car.totalPrice)}
                    </div>
                  </div>

                  <a
                    href="#contacts"
                    className="mt-5 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-red-600"
                  >
                    Запросить расчёт
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}