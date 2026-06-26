"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

export default function Hero() {
  const [brand, setBrand] = useState("SUBARU");
  const [q, setQ] = useState("");
  const [yearFrom, setYearFrom] = useState("2010");
  const [budget, setBudget] = useState("3000000");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (q) params.set("q", q);
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (budget) params.set("priceTo", budget);

    window.location.href = `/catalog?${params.toString()}`;
  }

  return (
    <section className="relative min-h-[760px] overflow-hidden">
      <Image
        src="/mosaic/hero-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/82 to-white/10" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-[#eef5ff]" />

      <div className="mosaic-shell relative z-10 grid min-h-[760px] items-center gap-10 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-[720px]">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-[#07152f] shadow-xl shadow-slate-300/50">
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
            Прямой доступ к аукционам Японии
          </div>

          <h1 className="text-[54px] font-black leading-[0.95] tracking-[-0.06em] text-[#07152f] md:text-[78px] lg:text-[92px]">
            Автомобили с аукционов Японии{" "}
            <span className="text-[#ff2d3d]">под ключ</span>
          </h1>

          <p className="mt-8 max-w-xl text-xl leading-8 text-slate-700">
            Актуальные лоты, статистика продаж, фото, аукционные листы и расчёт стоимости под ключ.
          </p>

          <form onSubmit={submit} className="mosaic-card mt-10 max-w-[720px] rounded-[2rem] p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_1.4fr_0.8fr_0.9fr_auto]">
              <label className="text-sm font-extrabold text-slate-700">
                Марка
                <select
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-black text-[#07152f] outline-none focus:border-blue-400"
                >
                  <option>SUBARU</option>
                  <option>TOYOTA</option>
                  <option>HONDA</option>
                  <option>NISSAN</option>
                  <option>MAZDA</option>
                  <option>LEXUS</option>
                </select>
              </label>

              <label className="text-sm font-extrabold text-slate-700">
                Модель, кузов или номер
                <input
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Введите модель"
                  className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-bold outline-none placeholder:text-slate-400 focus:border-blue-400"
                />
              </label>

              <label className="text-sm font-extrabold text-slate-700">
                Год от
                <input
                  value={yearFrom}
                  onChange={(event) => setYearFrom(event.target.value)}
                  className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-black outline-none focus:border-blue-400"
                />
              </label>

              <label className="text-sm font-extrabold text-slate-700">
                Бюджет до
                <input
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-black outline-none focus:border-blue-400"
                />
              </label>

              <button className="mt-auto h-14 rounded-2xl bg-[#ff2d3d] px-8 font-black text-white shadow-lg shadow-red-200 transition hover:bg-[#e51d2d]">
                Найти
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="mr-2 text-sm font-bold text-slate-500">Популярно:</span>
              {["Toyota", "Honda", "Nissan", "Mazda", "Lexus", "Subaru"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setBrand(item.toUpperCase())}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  {item}
                </button>
              ))}
            </div>
          </form>
        </div>

        <div className="relative hidden min-h-[560px] lg:block">
          <Image
            src="/mosaic/hero-car-v2.png"
            alt="Автомобиль из Японии"
            width={1800}
            height={1000}
            priority
            className="absolute bottom-4 right-[-80px] w-[920px] max-w-none drop-shadow-[0_45px_60px_rgba(7,21,47,0.28)]"
          />

          <div className="absolute bottom-10 right-0 rounded-[1.8rem] bg-white/92 p-7 shadow-2xl shadow-slate-400/40 backdrop-blur">
            <div className="text-sm font-bold text-slate-500">Более</div>
            <div className="text-4xl font-black text-[#ff2d3d]">250 000</div>
            <div className="mt-1 font-bold text-[#07152f]">автомобилей в базе</div>
          </div>
        </div>
      </div>
    </section>
  );
}
