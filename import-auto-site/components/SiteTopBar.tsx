"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function TokyoClock() {
  const [value, setValue] = useState("");

  useEffect(() => {
    const update = () => {
      setValue(
        new Intl.DateTimeFormat("ru-RU", {
          timeZone: "Asia/Tokyo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()).replace(",", "")
      );
    };

    update();
    const timer = window.setInterval(update, 30000);

    return () => window.clearInterval(timer);
  }, []);

  return <span>{value || "28.06.2026, 22:00"}</span>;
}

function MiniChart() {
  return (
    <svg viewBox="0 0 120 32" className="h-8 w-32" aria-hidden="true">
      <path
        d="M2 22 C12 26, 20 24, 30 25 S48 16, 58 19 S72 21, 82 13 S101 18, 118 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RateCard({ title, value, change }: { title: string; value: string; change: string }) {
  return (
    <div className="hidden min-w-[250px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-2 shadow-sm xl:flex">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{title}</div>
        <div className="text-lg font-black text-[#07152f]">
          {value} <span className="text-sm font-black text-green-600">▲ {change}</span>
        </div>
      </div>
      <div className="text-green-600">
        <MiniChart />
      </div>
    </div>
  );
}

export default function SiteTopBar() {
  return (
    <header className="border-t-4 border-[#d8001f] border-b border-slate-200 bg-[#f6f8fc]">
      <div className="mx-auto flex min-h-[76px] max-w-[1800px] items-center justify-between gap-4 px-5">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/"
            className="rounded-xl bg-white px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-slate-500 shadow-sm ring-1 ring-slate-100 hover:text-[#07152f]"
          >
            Начало
          </Link>

          <div className="hidden items-center gap-2 text-lg font-black uppercase tracking-[0.10em] text-slate-500 md:flex">
            <span>TOKYO</span>
            <span className="text-[#07152f]">
              <TokyoClock />
            </span>
          </div>

          <Link href="/catalog" className="hidden text-lg font-black text-[#2454d8] hover:text-[#d8001f] lg:block">
            27 579 авто из Японии
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <RateCard title="ЦБ РФ · 100 JPY" value="47,6186 ₽" change="0,8555" />
          <RateCard title="ЦБ РФ · 1 CNY" value="11,3359 ₽" change="0,2919" />

          <Link
            href="/catalog"
            className="rounded-2xl bg-[#07152f] px-7 py-4 text-base font-black text-white shadow-sm hover:bg-[#d8001f]"
          >
            Вход / Каталог
          </Link>
        </div>
      </div>
    </header>
  );
}
