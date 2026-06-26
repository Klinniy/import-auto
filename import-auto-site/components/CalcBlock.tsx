"use client";

import Image from "next/image";
import { useState } from "react";

export default function CalcBlock() {
  const [budget, setBudget] = useState("3000000");

  return (
    <section id="calc" className="py-20">
      <div className="mosaic-shell">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#07152f] p-8 text-white shadow-2xl shadow-slate-300/70 md:p-12">
          <Image
            src="/mosaic/calc-bg.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-26"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07152f] via-[#07152f]/90 to-[#07152f]/35" />

          <div className="relative z-10 grid gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-red-300">
                Калькулятор
              </div>
              <h2 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">
                Расчёт стоимости под ключ
              </h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
                Аукционная цена, валюта, логистика, пошлины, оформление, комиссия и доставка —
                всё будет собрано в одном понятном расчёте.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-6 text-[#07152f] shadow-2xl">
              <label className="text-sm font-black text-slate-600">
                Ваш бюджет, ₽
                <input
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="mt-2 h-16 w-full rounded-2xl border border-slate-200 px-5 text-xl font-black outline-none focus:border-blue-400"
                />
              </label>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <div className="text-sm font-bold text-slate-500">Предварительный статус</div>
                <div className="mt-1 text-3xl font-black">расчёт подключается</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Следующий этап — связать калькулятор с курсами валют и формулой стоимости.
                </p>
              </div>

              <button className="mt-5 w-full rounded-2xl bg-[#ff2d3d] px-6 py-4 font-black text-white transition hover:bg-[#e51d2d]">
                Получить расчёт
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
