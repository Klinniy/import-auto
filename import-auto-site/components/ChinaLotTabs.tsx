"use client";

import Link from "next/link";
import { useState } from "react";
import ChinaLotCalculatorPanel from "./ChinaLotCalculatorPanel";

type AnyCar = Record<string, any>;

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function formatNum(value: unknown) {
  const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n) || !n) return "—";
  return new Intl.NumberFormat("ru-RU").format(Math.round(n));
}

function formatCny(value: unknown) {
  const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n) || !n) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ¥`;
}

function row(label: string, value: unknown) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-black text-[#07152f]">{String(value || "—")}</span>
    </div>
  );
}

export default function ChinaLotTabs({ car }: { car: AnyCar }) {
  const [active, setActive] = useState<"content" | "calculator">("content");

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-8 lg:px-6">
      <div className="rounded-[1.5rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-sm font-black uppercase tracking-[0.24em] text-[#ff2d3d]">
              Китай · лот {car.lot}
            </div>

            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">
              {car.brand} {car.model}
            </h1>

            <p className="mt-2 text-lg font-bold text-slate-500">
              {car.year || "—"} · {car.grade || car.color || "—"}
            </p>
          </div>

          <div className="rounded-2xl bg-[#07152f] p-5 text-white">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-300">
              ориентировочная ориентировочная цена в Китае
            </div>
            <div className="mt-2 text-4xl font-black">{formatCny(car.priceCny)}</div>
            <div className="mt-2 text-sm font-bold text-slate-300">
              Ориентировочная стоимость автомобиля в Китае. Итоговую цену с доставкой,
              таможней и оформлением рассчитываем отдельно.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-[1.25rem] bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
        <button
          type="button"
          onClick={() => setActive("content")}
          className={`px-4 py-5 text-sm font-black transition ${
            active === "content"
              ? "bg-[#07152f] text-white"
              : "bg-white text-[#07152f] hover:bg-slate-50"
          }`}
        >
          Содержание лота
        </button>

        <button
          type="button"
          onClick={() => setActive("calculator")}
          className={`px-4 py-5 text-sm font-black transition ${
            active === "calculator"
              ? "bg-[#07152f] text-white"
              : "bg-white text-[#07152f] hover:bg-slate-50"
          }`}
        >
          Авто калькулятор
        </button>
      </div>

      {active === "content" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Фото автомобиля</h2>
              <span className="text-sm font-bold text-slate-400">
                {car.images?.length || 0} фото
              </span>
            </div>

            {car.images?.[0] ? (
              <img
                src={car.images[0].medium}
                alt={`${car.brand} ${car.model}`}
                className="max-h-[520px] w-full rounded-2xl bg-slate-100 object-contain"
              />
            ) : (
              <div className="flex h-[360px] items-center justify-center rounded-2xl bg-slate-100 font-black text-slate-400">
                нет фото
              </div>
            )}

            {car.images?.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {car.images.map((image: any, index: number) => (
                  <a key={image.original || index} href={image.original} target="_blank" rel="noreferrer">
                    <img
                      src={image.preview}
                      alt={`${car.brand} ${car.model} ${index + 1}`}
                      className="h-20 w-28 rounded-lg object-cover ring-1 ring-slate-200 transition hover:ring-[#ff2d3d]"
                    />
                  </a>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
              <h2 className="text-xl font-black">Характеристики</h2>
              <div className="mt-3">
                {row("Марка", car.brand)}
                {row("Модель", car.model)}
                {row("Год", car.year)}
                {row("Комплектация", car.grade)}
                {row("Цвет", car.color)}
                {row("Кузов", car.body)}
                {row("Объём", car.engineVolume ? `${formatNum(car.engineVolume)} см³` : "—")}
                {row("Мощность", car.power ? `${car.power} л.с.` : "—")}
                {row("КПП", car.transmission)}
                {row("Привод", car.drive)}
                {row("Пробег", car.mileage ? `${formatNum(car.mileage)} км` : "—")}
              </div>
            </section>

            <section className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
              <h2 className="text-xl font-black">Информация по лоту</h2>
              <div className="mt-3">
                {row("Лот", car.lot)}
                {row("Источник", "Китай")}
                {row("Дата", car.auctionDate === "0000-00-00 00:00:00" ? "—" : car.auctionDate)}
                {row("Ориентировочная ориентировочная ориентировочная цена в Китае", formatCny(car.priceCny))}
              </div>
            </section>
          </aside>
        </div>
      ) : (
        <div className="mt-6">
          <ChinaLotCalculatorPanel car={car} />
        </div>
      )}
    </section>
  );
}
