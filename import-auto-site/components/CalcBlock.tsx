"use client";

import { useState } from "react";

export default function CalcBlock() {
  const [budget, setBudget] = useState("3000000");

  return (
    <section id="calc" className="bg-slate-950 py-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Расчёт по стране импорта
          </h2>
          <p className="mt-4 max-w-xl text-slate-300">
            Для каждой страны будет отдельная формула: валюта, логистика,
            пошлины, сборы, комиссия и сроки.
          </p>

          <div className="mt-8 space-y-4 text-slate-200">
            <div>✅ Япония: аукционная цена + расходы + таможня</div>
            <div>✅ Китай: цена поставщика + экспорт + логистика + оформление</div>
            <div>✅ Корея: площадка/дилер + проверка + доставка + таможня</div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
          <label className="text-sm font-semibold text-slate-700">
            Ваш бюджет, ₽
          </label>
          <input
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 text-lg outline-none focus:border-red-500"
          />

          <div className="mt-5 rounded-2xl bg-slate-50 p-5">
            <div className="text-sm text-slate-500">Статус функции</div>
            <div className="mt-1 text-2xl font-bold">доступно после входа</div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              В боевой версии расчёт будет персональным и сохранится в личном
              кабинете клиента.
            </p>
          </div>

          <a
            href="#auth"
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700"
          >
            Войти для расчёта
          </a>
        </div>
      </div>
    </section>
  );
}