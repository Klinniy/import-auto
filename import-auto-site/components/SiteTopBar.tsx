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
        })
          .format(new Date())
          .replace(",", "")
      );
    };

    update();

    const timer = window.setInterval(update, 30000);

    return () => window.clearInterval(timer);
  }, []);

  return <span>{value || "—"}</span>;
}

function MiniChart() {
  return (
    <svg viewBox="0 0 120 32" className="h-6 w-24" aria-hidden="true">
      <path
        d="M2 22 C14 26, 24 24, 34 25 S52 17, 62 19 S76 21, 86 14 S102 17, 118 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RateCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) {
  return (
    <div className="hidden h-14 min-w-[230px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm 2xl:flex">
      <div className="leading-none">
        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          {title}
        </div>
        <div className="whitespace-nowrap text-base font-black text-[#07152f]">
          {value} <span className="text-xs font-black text-green-600">▲ {change}</span>
        </div>
      </div>

      <div className="shrink-0 text-green-600">
        <MiniChart />
      </div>
    </div>
  );
}

export default function SiteTopBar() {
  return (
    <header className="border-t-4 border-[#d8001f] border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[70px] max-w-[1800px] items-center justify-between gap-4 px-5">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/"
            className="shrink-0 rounded-xl bg-[#f3f6fb] px-5 py-3 text-sm font-black uppercase tracking-[0.10em] text-slate-500 hover:bg-white hover:text-[#07152f] hover:shadow-sm"
          >
            Начало
          </Link>

          <div className="hidden shrink-0 items-center gap-2 text-base font-black uppercase tracking-[0.12em] text-slate-500 md:flex">
            <span>TOKYO</span>
            <span className="whitespace-nowrap text-[#07152f]">
              <TokyoClock />
            </span>
          </div>

          <Link
            href="/catalog"
            className="hidden whitespace-nowrap text-base font-black text-[#2454d8] hover:text-[#d8001f] lg:block"
          >
            27 579 авто из Японии
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <RateCard title="ЦБ РФ · 100 JPY" value="47,6186 ₽" change="0,8555" />
          <RateCard title="ЦБ РФ · 1 CNY" value="11,3359 ₽" change="0,2919" />

          <Link
            href="/catalog"
            className="whitespace-nowrap rounded-2xl bg-[#07152f] px-7 py-3.5 text-sm font-black text-white shadow-sm hover:bg-[#d8001f]"
          >
            Вход / Каталог
          </Link>
        </div>
      </div>
    </header>
  );
}
