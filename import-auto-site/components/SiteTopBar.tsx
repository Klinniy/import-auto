"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type RatePoint = {
  date?: string;
  value?: number;
  perOne?: number;
  nominal?: number;
};

type JpyHistoryPayload = {
  ok?: boolean;
  value?: number;
  diff?: number;
  diffPercent?: number;
  history?: RatePoint[];
  points?: RatePoint[];
  data?: RatePoint[];
  items?: RatePoint[];
};

function formatRate(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return `${value.toFixed(4).replace(".", ",")} ₽`;
}

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

function MiniChart({ points }: { points?: RatePoint[] }) {
  const safePoints = (points || [])
    .map((point) => ({
      ...point,
      value: Number(point.value || 0),
    }))
    .filter((point) => Number.isFinite(point.value) && point.value > 0)
    .slice(-20);

  const path = useMemo(() => {
    if (safePoints.length < 2) {
      return "M2 22 C14 26, 24 24, 34 25 S52 17, 62 19 S76 21, 86 14 S102 17, 118 5";
    }

    const values = safePoints.map((point) => Number(point.value));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return safePoints
      .map((point, index) => {
        const x = 2 + (index / Math.max(1, safePoints.length - 1)) * 116;
        const y = 28 - ((Number(point.value) - min) / range) * 23;

        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [safePoints]);

  return (
    <svg viewBox="0 0 120 32" className="h-6 w-24" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RateCard({
  title,
  fallbackValue,
  fallbackChange,
  isJpy = false,
}: {
  title: string;
  fallbackValue: string;
  fallbackChange: string;
  isJpy?: boolean;
}) {
  const [jpy, setJpy] = useState<JpyHistoryPayload | null>(null);

  useEffect(() => {
    if (!isJpy) return;

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/currency/jpy-history?ts=${Date.now()}`, {
          cache: "no-store",
        });

        const json = (await response.json()) as JpyHistoryPayload;

        if (!cancelled && json?.ok) {
          setJpy(json);
        }
      } catch {
        if (!cancelled) setJpy(null);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isJpy]);

  const points = jpy?.history || jpy?.points || jpy?.data || jpy?.items || [];
  const latestPoint = points.length ? points[points.length - 1] : null;

  const currentValue = Number(jpy?.value || latestPoint?.value || 0);
  const currentDiff = Number(jpy?.diff || 0);

  const value = isJpy && currentValue > 0 ? formatRate(currentValue) : fallbackValue;
  const change =
    isJpy && Number.isFinite(currentDiff) && currentDiff !== 0
      ? Math.abs(currentDiff).toFixed(4).replace(".", ",")
      : fallbackChange;

  const isPositive = currentDiff >= 0;

  return (
    <div className="hidden h-12 min-w-[220px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm xl:flex">
      <div className="leading-none">
        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          {title}
        </div>

        <div className="whitespace-nowrap text-[15px] font-black text-[#07152f]">
          {value}{" "}
          <span className={isPositive ? "text-xs font-black text-green-600" : "text-xs font-black text-red-500"}>
            {isPositive ? "▲" : "▼"} {change}
          </span>
        </div>
      </div>

      <div className={isPositive ? "shrink-0 text-green-600" : "shrink-0 text-red-500"}>
        <MiniChart points={isJpy ? points : undefined} />
      </div>
    </div>
  );
}

function CatalogCountLabel({ isStatistics, isChina }: { isStatistics: boolean; isChina: boolean }) {
  const [label, setLabel] = useState(isStatistics ? "1 285 273 авто из Японии" : isChina ? "27 579 авто из Китая" : "52 848 авто из Японии");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (isStatistics) {
          const response = await fetch(`/api/statistics/summary?ts=${Date.now()}`, {
            cache: "no-store",
          });

          const json = await response.json();

          if (!cancelled && json?.salesCountLabel) {
            setLabel(`${json.salesCountLabel} авто из Японии`);
          }

          return;
        }

        const endpoint = isChina ? "/api/china/catalog" : "/api/catalog";

        const response = await fetch(`${endpoint}?page=1&limit=1&ts=${Date.now()}`, {
          cache: "no-store",
        });

        const json = await response.json();
        const total = Number(json?.total || json?.summary?.found || 0);

        if (!cancelled && total > 0) {
          setLabel(`${new Intl.NumberFormat("ru-RU").format(total)} авто из ${isChina ? "Китая" : "Японии"}`);
        }
      } catch {
        // оставляем fallback
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isStatistics, isChina]);

  return <>{label}</>;
}

export default function SiteTopBar() {
  const pathname = usePathname();

  const isCatalog = pathname === "/catalog";
  const isLot = pathname.startsWith("/catalog/");
  const isStatistics = pathname === "/statistics";
  const isJapan = pathname === "/japan";
  const isChina = pathname === "/china" || pathname.startsWith("/china/");

  const isJapanOnly = isCatalog || isLot || isStatistics || isJapan;

  const actionHref = isCatalog || isStatistics || isJapan || isChina ? "/" : "/catalog";
  const actionLabel = isCatalog || isStatistics || isJapan || isChina ? "На главную" : "В каталог";

  return (
    <header className="border-t-4 border-[#d8001f] border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[64px] max-w-[1800px] items-center justify-between gap-4 px-5">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/"
            className="shrink-0 rounded-xl bg-[#f3f6fb] px-5 py-2.5 text-sm font-black uppercase tracking-[0.10em] text-slate-500 hover:bg-white hover:text-[#07152f] hover:shadow-sm"
          >
            Начало
          </Link>

          <div className="hidden shrink-0 items-center gap-2 text-[15px] font-black uppercase tracking-[0.12em] text-slate-500 md:flex">
            <span>{isChina ? "BEIJING" : "TOKYO"}</span>
            <span className="whitespace-nowrap text-[#07152f]">
              <TokyoClock />
            </span>
          </div>

          <Link
            href={isStatistics ? "/statistics" : isChina ? "/china" : "/catalog"}
            className="hidden whitespace-nowrap text-[15px] font-black text-[#2454d8] hover:text-[#d8001f] lg:block"
          >
            <CatalogCountLabel isStatistics={isStatistics} isChina={isChina} />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <RateCard
            title="ЦБ РФ · 100 JPY"
            fallbackValue="48,0600 ₽"
            fallbackChange="актуально"
            isJpy
          />

          {!isJapanOnly && (
            <RateCard
              title="ЦБ РФ · 1 CNY"
              fallbackValue="11,3359 ₽"
              fallbackChange="0,2919"
            />
          )}

          <Link
            href={actionHref}
            className="whitespace-nowrap rounded-2xl bg-[#07152f] px-7 py-3 text-sm font-black text-white shadow-sm hover:bg-[#d8001f]"
          >
            {actionLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}
