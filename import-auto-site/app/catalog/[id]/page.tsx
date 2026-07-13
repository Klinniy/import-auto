"use client";

import SiteTopBar from "@/components/SiteTopBar";



import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import LotSalesStatsPanel from "@/components/LotSalesStatsPanel";
import LotCalculatorPanel from "@/components/LotCalculatorPanel";

type CarImage = {
  original?: string;
  preview?: string;
  medium?: string;
};

type Car = {
  id?: string;
  lot?: string;
  brand?: string;
  model?: string;
  year?: string | number | null;
  body?: string;
  auction?: string;
  auctionDate?: string;
  rate?: string | number | null;
  grade?: string | number | null;
  mileage?: number | string | null;
  engineVolume?: number | string | null;
  transmission?: string;
  drive?: string;
  color?: string;
  sanction?: boolean | string | number;
  leftHandDrive?: boolean;
  startPrice?: number | string | null;
  finishPrice?: number | string | null;
  averagePrice?: number | string | null;
  status?: string;
  previewImage?: string;
  images?: Array<string | CarImage> | CarImage;
  equipment?: string;
  complectation?: string;
  frame?: string;
  frameNumber?: string;
  serial?: string;
  comment?: string;
  notes?: string;
  score?: string | number | null;
};

type CarPayload = {
  ok?: boolean;
  data?: unknown;
  item?: unknown;
  car?: unknown;
  result?: unknown;
  error?: string;
};


type FactoryCatalogItem = {
  image?: string;
  release?: string;
  modification?: string;
  body?: string;
  engine?: string;
  drive?: string;
  transmission?: string;
  volume?: string;
  power?: string;
  fuel?: string;
  price?: string;
  rec?: string;
};

type FactoryCatalogPayload = {
  ok?: boolean;
  id?: string;
  title?: string;
  total?: number;
  items?: FactoryCatalogItem[];
  error?: string;
  lot?: {
    markaId?: string;
    modelId?: string;
    brand?: string;
    model?: string;
    year?: string;
    body?: string;
  };
};

type FactoryDetailRow = {
  label: string;
  value: string;
};

type FactoryDetailSection = {
  title: string;
  rows: FactoryDetailRow[];
};

type FactoryDetailPayload = {
  ok?: boolean;
  title?: string;
  image?: string;
  sections?: FactoryDetailSection[];
  error?: string;
};

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatNumber(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return "—";

  const n = Number(value);

  if (!Number.isFinite(n)) return cleanText(value);

  return new Intl.NumberFormat("ru-RU").format(n);
}

function formatPrice(value?: number | string | null) {
  const n = Number(value);

  if (!Number.isFinite(n) || n <= 0) return "—";

  return `${formatNumber(n)} ¥`;
}

function statusLabel(value?: string) {
  const text = String(value || "").toLowerCase().trim();

  if (!text) return "—";
  if (text === "sold" || text.includes("sold by")) return "продан";
  if (text === "not sold") return "не продан";
  if (text === "removed") return "снят";
  if (text === "cancelled" || text === "canceled") return "отменен";

  return cleanText(value);
}

function tokyoTime() {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tokyo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function isSanction(car: Car) {
  const value = car.sanction;

  if (value === true || value === 1) return true;

  if (typeof value === "string") {
    return ["1", "true", "yes", "да", "y"].includes(value.toLowerCase());
  }

  return false;
}

function unwrapCar(payload: CarPayload): Car | null {
  const candidates = [
    payload?.data,
    payload?.item,
    payload?.car,
    payload?.result,
    payload,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    const value = candidate as Car;

    if (
      value.id ||
      value.lot ||
      value.brand ||
      value.model ||
      value.images ||
      value.previewImage
    ) {
      return value;
    }
  }

  return null;
}

function imageUrl(item: string | CarImage | undefined) {
  if (!item) return "";
  if (typeof item === "string") return item;

  return item.original || item.medium || item.preview || "";
}

function isNoPhotoImage(url: string) {
  const value = String(url || "").toLowerCase();

  return (
    value.includes("no_photo") ||
    value.includes("no-photo") ||
    value.includes("nophoto") ||
    value.includes("noimage") ||
    value.includes("no_image") ||
    value.includes("nofoto") ||
    value.includes("no_foto") ||
    value.includes("no-foto") ||
    value.includes("placeholder")
  );
}

function looksLikeAuctionSheet(url: string) {
  const value = String(url || "").toLowerCase();

  return (
    value.includes("sheet") ||
    value.includes("auction") ||
    value.includes("list") ||
    value.includes("map") ||
    value.includes("schema")
  );
}

function carImages(car: Car) {
  const result: string[] = [];

  if (Array.isArray(car.images)) {
    for (const item of car.images) {
      const url = imageUrl(item);
      if (url) result.push(url);
    }
  } else if (car.images && typeof car.images === "object") {
    const url = imageUrl(car.images);
    if (url) result.push(url);
  }

  // previewImage — это маленькая превьюшка. Используем её только если других фото нет.
  // Иначе она попадает в конец массива и может ошибочно стать "аукционным листом".
  if (result.length === 0 && car.previewImage) result.push(car.previewImage);

  return Array.from(
    new Set(
      result.filter((url) => Boolean(url) && !isNoPhotoImage(url))
    )
  );
}

function splitImages(car: Car) {
  const images = carImages(car).filter((url) => !isNoPhotoImage(url));

  // Для японских лотов аукционный лист часто приходит первым изображением
  // в общем массиве IMAGES. Сначала используем явные поля, затем URL-признаки,
  // затем fallback: первое изображение, если в лоте есть ещё фото автомобиля.
  const explicitAuctionSheet = imageUrl(
    (car as any).auctionSheetImage ||
    (car as any).auctionSheetUrl ||
    (car as any).sheetImage ||
    (car as any).schemeImage ||
    (car as any).sheet ||
    (car as any).auctionSheet
  );

  const detectedAuctionSheet = images.find((url) => looksLikeAuctionSheet(url)) || "";

  const auctionSheet =
    explicitAuctionSheet ||
    detectedAuctionSheet ||
    (images.length > 1 ? images[0] : "");

  const photos = images.filter((url) => {
    if (auctionSheet && url === auctionSheet) return false;
    return true;
  });

  return {
    damageMap: "",
    auctionSheet,
    photos,
    all: images,
  };
}

function carTitle(car: Car) {
  return `${car.brand || "AUTO"} ${car.model || ""}`.trim();
}

function copyText(value: string) {
  if (!value) return;
  navigator.clipboard?.writeText(value).catch(() => {});
}


function LotActionButtons({ activeAction, onAction }: { activeAction: string; onAction: (action: string) => void }) {
  const actions = [
    {
      title: "Содержание лота",
      icon: "car",
      active: true,
      action: "content",
    },
    {
      title: "Статистика продаж",
      icon: "stats",
      active: false,
      action: "sales-stats",
    },
    {
      title: "Каталог автомобилей",
      icon: "catalog",
      active: false,
      action: "catalog",
    },
    {
      title: "Авто калькулятор",
      icon: "calculator",
      active: false,
      action: "calculator",
    },
    {
      title: "Предыдущие торги",
      icon: "history",
      active: false,
      action: "previous-trades",
    },
  ];

  function Icon({ type }: { type: string }) {
    const cls = "h-7 w-7";

    if (type === "car") {
      return (
        <svg viewBox="0 0 48 48" className={cls} fill="none" aria-hidden="true">
          <path d="M10 28l3.2-8.4A6 6 0 0 1 18.8 16h10.4a6 6 0 0 1 5.6 3.6L38 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 28h26v7a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-.5H19v.5a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-7Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <path d="M17 29.5h.1M31 29.5h.1" stroke="#ff2d3d" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    }

    if (type === "stats") {
      return (
        <svg viewBox="0 0 48 48" className={cls} fill="none" aria-hidden="true">
          <path d="M10 38h28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 32V23M24 32V13M33 32V18" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M12 18l8 5 8-9 8 4" stroke="#ff2d3d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (type === "catalog") {
      return (
        <svg viewBox="0 0 48 48" className={cls} fill="none" aria-hidden="true">
          <rect x="11" y="11" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="3" />
          <rect x="27" y="11" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="3" />
          <rect x="11" y="27" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="3" />
          <rect x="27" y="27" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="3" />
          <path d="M16 16h.1M32 16h.1M16 32h.1M32 32h.1" stroke="#ff2d3d" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    }

    if (type === "calculator") {
      return (
        <svg viewBox="0 0 48 48" className={cls} fill="none" aria-hidden="true">
          <rect x="14" y="7" width="20" height="34" rx="4" stroke="currentColor" strokeWidth="3" />
          <path d="M19 15h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M19 24h.1M24 24h.1M29 24h.1M19 31h.1M24 31h.1M29 31h.1M19 37h.1M24 37h.1M29 37h.1" stroke="#ff2d3d" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 48 48" className={cls} fill="none" aria-hidden="true">
        <path d="M13 12h21a3 3 0 0 1 3 3v21H17a4 4 0 0 1-4-4V12Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M19 21h11M19 28h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 13l4-4M38 9v10H28" stroke="#ff2d3d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-5">
        {actions.map((action) => (
          <button
            key={action.action}
            type="button"
            onClick={() => onAction(action.action)}
            data-lot-action={action.action}
            className={`group relative flex min-h-[96px] flex-col items-center justify-center gap-2 border-b border-slate-100 px-3 py-4 text-center transition md:border-b-0 md:border-r last:md:border-r-0 ${
              activeAction === action.action
                ? "bg-[#07152f] text-white"
                : "bg-white text-[#07152f] hover:bg-slate-50"
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border shadow-sm transition ${
                activeAction === action.action
                  ? "border-white/20 bg-white text-[#07152f]"
                  : "border-slate-200 bg-slate-50 text-[#07152f] group-hover:border-[#ff2d3d]/50 group-hover:text-[#ff2d3d]"
              }`}
            >
              <Icon type={action.icon} />
            </span>

            <span
              className={`max-w-[150px] text-[13px] font-black leading-tight ${
                activeAction === action.action ? "text-white" : "text-[#07152f]"
              }`}
            >
              {action.title}
            </span>

            <span
              className={`absolute inset-x-0 bottom-0 h-[4px] transition ${
                activeAction === action.action ? "bg-[#ff2d3d]" : "bg-transparent group-hover:bg-[#ff2d3d]"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}



const AUCTION_SHEET_LEGEND: { code: string; label: string }[][] = [
  [
    { code: "A1", label: "Маленькая царапина" },
    { code: "A2", label: "Царапина" },
    { code: "A3", label: "Большая царапина" },
    { code: "E1", label: "Незначительная вмятина" },
    { code: "E2", label: "Несколько небольших вмятин" },
    { code: "E3", label: "Много небольших вмятин" },
    { code: "U1", label: "Маленькая вмятина" },
    { code: "U2", label: "Вмятина" },
    { code: "U3", label: "Большая вмятина" },
    { code: "W1", label: "Ремонт / покраска: едва заметно" },
    { code: "W2", label: "Ремонт / покраска: заметно" },
    { code: "W3", label: "Ремонт / покраска: заметно, нужна перекраска" },
    { code: "S1", label: "Малозаметная ржавчина" },
    { code: "S2", label: "Ржавчина" },
    { code: "C1", label: "Коррозия" },
    { code: "C2", label: "Заметная коррозия" },
    { code: "P", label: "Краска отличается от оригинала" },
    { code: "H", label: "Следы улучшения / подкраса" },
  ],
  [
    { code: "X", label: "Элемент требует замены" },
    { code: "XX", label: "Элемент заменён" },
    { code: "B1", label: "Маленькая вмятина с царапиной" },
    { code: "B2", label: "Вмятина с царапиной" },
    { code: "B3", label: "Большая вмятина с царапиной" },
    { code: "Y1", label: "Маленькая трещина" },
    { code: "Y2", label: "Трещина" },
    { code: "Y3", label: "Большая трещина" },
    { code: "X1", label: "Маленькая трещина на лобовом стекле" },
    { code: "R", label: "Восстановленная трещина на лобовом стекле" },
    { code: "RX", label: "Восстановленная трещина на стекле, требуется замена" },
    { code: "G", label: "Скол на стекле" },
  ],
];

function AuctionSheetLegendCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="text-sm font-black text-[#07152f]">Справочник обозначений</div>
        <div className="mt-1 text-xs font-bold text-slate-500">
          Расшифровка меток на аукционном листе
        </div>
      </div>

      <div className="grid gap-x-5 gap-y-2 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {AUCTION_SHEET_LEGEND.flat().map((item, index) => (
          <div
            key={`${index}-${item.code}-${item.label}`}
            className="grid grid-cols-[42px_minmax(0,1fr)] items-start gap-2 text-[11px] leading-4"
          >
            <span className="rounded-lg bg-[#07152f] px-2 py-1 text-center font-black text-white">
              {item.code}
            </span>
            <span className="pt-1 font-bold text-slate-700">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs">
        <div className="font-black text-[#07152f]">Описание</div>
        <div className="mt-1 font-bold text-slate-600">
          <span className="text-slate-900">Rate ext.</span> — внешнее состояние,
          {" "}
          <span className="text-slate-900">Rate int.</span> — состояние салона.
        </div>
      </div>
    </div>
  );
}


function FactoryCatalogPanel({
  payload,
  loading,
  error,
}: {
  payload: FactoryCatalogPayload | null;
  loading: boolean;
  error: string;
}) {
  const items = payload?.items || [];

  const mnfId = String(payload?.lot?.markaId || "").trim();
  const mdlId = String(payload?.lot?.modelId || "").trim();

  const catalogGroups = items.reduce<Array<{ key: string; image?: string; release?: string; rows: FactoryCatalogItem[] }>>(
    (groups, item) => {
      const key = `${item.image || ""}|${item.release || ""}`;
      const last = groups[groups.length - 1];

      const exactKey = [
        item.release,
        item.modification,
        item.body,
        item.engine,
        item.drive,
        item.transmission,
        item.volume,
        item.power,
        item.fuel,
        item.price,
        item.rec,
      ].join("|");

      if (groups.some((group) => group.rows.some((row) => [
        row.release,
        row.modification,
        row.body,
        row.engine,
        row.drive,
        row.transmission,
        row.volume,
        row.power,
        row.fuel,
        row.price,
        row.rec,
      ].join("|") === exactKey))) {
        return groups;
      }

      if (last && last.key === key) {
        last.rows.push(item);
        return groups;
      }

      groups.push({
        key,
        image: item.image,
        release: item.release,
        rows: [item],
      });

      return groups;
    },
    []
  );

  return (
    <section id="factory-catalog" className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[#07152f] px-4 py-4 text-white">
        <div className="text-lg font-black">Каталог автомобилей</div>
        <div className="mt-1 text-sm font-bold text-white/70">
          Заводские модификации, кузов, двигатель, привод, КПП и цена по каталогу
        </div>
      </div>

      {loading ? (
        <div className="p-5 text-sm font-bold text-slate-500">Загружаю каталог автомобиля...</div>
      ) : error ? (
        <div className="p-5 text-sm font-bold text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="p-5 text-sm font-bold text-slate-500">По этому лоту каталог не найден.</div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-sm font-black text-slate-900">
                {payload?.title || "Данные каталога автомобиля"}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-500">
                Найдено строк: {items.length}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-3">Фото</th>
                  <th className="px-3 py-3">Выпуск</th>
                  <th className="px-3 py-3">Модификация</th>
                  <th className="px-3 py-3">Кузов</th>
                  <th className="px-3 py-3">Двигатель</th>
                  <th className="px-3 py-3">Привод</th>
                  <th className="px-3 py-3">КПП</th>
                  <th className="px-3 py-3">Объем</th>
                  <th className="px-3 py-3">Мощн.</th>
                  <th className="px-3 py-3">Топливо</th>
                  <th className="px-3 py-3">Цена, тыс. ¥</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalogGroups.flatMap((group) =>
                  group.rows.map((item, index) => (
                    <tr key={`${group.key}-${item.rec || index}-${item.drive || ""}`} className="hover:bg-slate-50">
                      {index === 0 && (
                        <td className="px-3 py-3 align-top" rowSpan={group.rows.length}>
                          {group.image ? (
                            <img
                              src={group.image}
                              alt={item.modification || "catalog"}
                              className="h-12 w-20 rounded-lg object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-12 w-20 rounded-lg bg-slate-100" />
                          )}
                        </td>
                      )}

                      {index === 0 && (
                        <td className="whitespace-nowrap px-3 py-3 align-top font-bold text-slate-700" rowSpan={group.rows.length}>
                          {group.release || "—"}
                        </td>
                      )}

                      <td className="px-3 py-3 font-black text-slate-900">
                        {item.rec && mnfId && mdlId ? (
                          <Link
                            href={`/catalog/factory/${encodeURIComponent(mnfId)}/${encodeURIComponent(mdlId)}/${encodeURIComponent(item.rec)}`}
                            className="text-left font-black text-[#07152f] underline decoration-dotted underline-offset-4 hover:text-[#d8001f]"
                          >
                            {item.modification || "—"}
                            <span className="mt-0.5 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                              открыть характеристики
                            </span>
                          </Link>
                        ) : (
                          item.modification || "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">{item.body || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{item.engine || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{item.drive || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{item.transmission || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{item.volume || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{item.power || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{item.fuel || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-black text-green-700">{item.price || "—"}</td>
                    </tr>
                  ))
                )}
</tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}


function FactoryCatalogDetailPanel({
  payload,
  loading,
  error,
}: {
  payload: FactoryDetailPayload | null;
  loading: boolean;
  error: string;
}) {
  const sections = payload?.sections || [];
  const cleanTitle = cleanText(payload?.title || "").replace(/\s*\/\s*BUY NOW\s*$/i, "");

  if (!loading && !error && !payload) return null;

  return (
    <section id="factory-detail" className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
        <div className="text-lg font-black text-[#07152f]">Подробности модификации</div>
        <div className="mt-1 text-sm font-bold text-slate-500">
          {cleanTitle || "Технические характеристики выбранной комплектации"}
        </div>
      </div>

      {loading ? (
        <div className="p-5 text-sm font-bold text-slate-500">Загружаю подробности модификации...</div>
      ) : error ? (
        <div className="p-5 text-sm font-bold text-red-600">{error}</div>
      ) : (
        <div className="p-4">
          <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div>
              {payload?.image ? (
                <img
                  src={payload.image}
                  alt={cleanTitle || "Модификация"}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain p-2"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-36 items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-400">
                  Нет фото
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sections.map((section) => (
                <div key={section.title} className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="bg-[#07152f] px-3 py-2 text-sm font-black text-white">
                    {section.title}
                  </div>

                  <div className="divide-y divide-slate-100">
                    {section.rows.map((row) => (
                      <div key={`${section.title}-${row.label}-${row.value}`} className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] gap-3 px-3 py-2 text-xs">
                        <div className="font-bold text-slate-500">{row.label}</div>
                        <div className="font-black text-slate-900">{row.value || "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


export default function LotDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : String(rawId || "");

  const [backHref, setBackHref] = useState("/catalog");
  const [prevId, setPrevId] = useState("");
  const [nextId, setNextId] = useState("");

  const [car, setCar] = useState<Car | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeAction, setActiveAction] = useState("content");
  const [factoryCatalog, setFactoryCatalog] = useState<FactoryCatalogPayload | null>(null);
  const [factoryLoading, setFactoryLoading] = useState(false);
  const [factoryError, setFactoryError] = useState("");

  const [selectedFactoryRec, setSelectedFactoryRec] = useState("");
  const [factoryDetail, setFactoryDetail] = useState<FactoryDetailPayload | null>(null);
  const [factoryDetailLoading, setFactoryDetailLoading] = useState(false);
  const [factoryDetailError, setFactoryDetailError] = useState("");

  const images = useMemo(() => splitImages(car || {}), [car]);
  const title = car ? carTitle(car) : "Лот";

  const salesStatsHref = useMemo(() => {
    if (!car) return "/catalog/sales-stats";

    const source = car as any;
    const params = new URLSearchParams();

    function cleanStatValue(value: unknown) {
      return String(value ?? "").replace(/\s+/g, " ").trim();
    }

    function pickStatValue(...values: unknown[]) {
      for (const value of values) {
        const cleaned = cleanStatValue(value);
        if (cleaned && cleaned !== "__any__") return cleaned;
      }

      return "";
    }

    function addStatParam(key: string, value: unknown) {
      const cleaned = cleanStatValue(value);
      if (cleaned && cleaned !== "__any__") {
        params.set(key, cleaned);
      }
    }

    addStatParam(
      "brand",
      pickStatValue(
        source.brand,
        source.marka,
        source.markaName,
        source.make,
        source.MARKA_NAME
      )
    );

    addStatParam(
      "model",
      pickStatValue(
        source.model,
        source.modelName,
        source.MODEL_NAME
      )
    );

    addStatParam(
      "body",
      pickStatValue(
        source.body,
        source.kuzov,
        source.chassis,
        source.frame,
        source.KUZOV
      )
    );

    const statYear = pickStatValue(
      source.year,
      source.YEAR,
      source.releaseYear
    );

    addStatParam("yearFrom", statYear);
    addStatParam("yearTo", statYear);

    const query = params.toString();

    return query ? `/catalog/sales-stats?${query}` : "/catalog/sales-stats";
  }, [car]);

  function handleLotAction(action: string) {
    setActiveAction(action);
  }



  useEffect(() => {
    if (!id || typeof window === "undefined") return;

    try {
      const storedBack = window.sessionStorage.getItem("mosaicauto.catalogBackUrl");
      const storedIdsRaw = window.sessionStorage.getItem("mosaicauto.catalogIds");

      if (storedBack) {
        setBackHref(storedBack);
      }

      const storedIds = storedIdsRaw ? JSON.parse(storedIdsRaw) : [];

      if (Array.isArray(storedIds)) {
        const ids = storedIds.map((item) => String(item || "")).filter(Boolean);
        const index = ids.indexOf(id);

        setPrevId(index > 0 ? ids[index - 1] : "");
        setNextId(index >= 0 && index < ids.length - 1 ? ids[index + 1] : "");
      }
    } catch {
      setBackHref("/catalog");
      setPrevId("");
      setNextId("");
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError("");

    fetch(
      `/api/car/${encodeURIComponent(id)}${new URLSearchParams(window.location.search).get("source") ? `?source=${encodeURIComponent(new URLSearchParams(window.location.search).get("source") || "")}` : ""}`,
      { cache: "no-store" }
    )
      .then((res) => res.json())
      .then((payload: CarPayload) => {
        if (payload?.ok === false) {
          throw new Error(payload.error || "Ошибка загрузки лота");
        }

        const nextCar = unwrapCar(payload);

        if (!nextCar) {
          throw new Error("Лот не найден");
        }

        setCar(nextCar);

        const nextImages = splitImages(nextCar);
        setSelectedImage(
          nextImages.photos[0] ||
          "/mosaic/car-placeholder.png"
        );
      })
      .catch((err) => {
        setCar(null);
        setSelectedImage("");
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || activeAction !== "catalog") return;

    let ignore = false;

    setFactoryLoading(true);
    setFactoryError("");

    fetch(`/api/catalog/factory/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: FactoryCatalogPayload) => {
        if (ignore) return;

        if (payload?.ok === false) {
          throw new Error(payload.error || "Каталог автомобиля не найден");
        }

        setFactoryCatalog(payload);
      })
      .catch((err: Error) => {
        if (!ignore) {
          setFactoryError(err.message || "Ошибка загрузки каталога автомобиля");
          setFactoryCatalog(null);
        }
      })
      .finally(() => {
        if (!ignore) setFactoryLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, activeAction]);

  function openFactoryDetail(item: FactoryCatalogItem) {
    const rec = String(item.rec || "").trim();
    const mnfId = String(factoryCatalog?.lot?.markaId || "").trim();
    const mdlId = String(factoryCatalog?.lot?.modelId || "").trim();

    if (!rec || !mnfId || !mdlId) {
      setFactoryDetailError("Не хватает параметров для загрузки подробностей модификации");
      setFactoryDetail(null);
      return;
    }

    setSelectedFactoryRec(rec);
    setFactoryDetailLoading(true);
    setFactoryDetailError("");

    const params = new URLSearchParams({
      mnf_id: mnfId,
      mdl_id: mdlId,
      rec,
    });

    fetch(`/api/catalog/factory/detail?${params.toString()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload: FactoryDetailPayload) => {
        if (payload?.ok === false) {
          throw new Error(payload.error || "Подробности модификации не найдены");
        }

        setFactoryDetail(payload);

        setTimeout(() => {
          document.getElementById("factory-detail")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 50);
      })
      .catch((err: Error) => {
        setFactoryDetailError(err.message || "Ошибка загрузки подробностей модификации");
        setFactoryDetail(null);
      })
      .finally(() => {
        setFactoryDetailLoading(false);
      });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
        <TopBar backHref={backHref} prevId={prevId} nextId={nextId} />
        <div className="mx-auto max-w-[1800px] p-4">
          <div className="rounded-3xl bg-white p-10 text-center text-lg font-black shadow-sm">
            Загружаем лот...
          </div>
        </div>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
        <TopBar backHref={backHref} prevId={prevId} nextId={nextId} />
        <div className="mx-auto max-w-[1800px] p-4">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <div className="text-2xl font-black text-red-700">
              Не удалось открыть лот
            </div>
            <div className="mt-2 text-sm font-bold text-red-600">{error}</div>
            <Link
              href="/catalog"
              className="mt-5 inline-flex rounded-2xl bg-[#07152f] px-5 py-3 font-black text-white"
            >
              Вернуться в каталог
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const bodyNumber = cleanText(car.frameNumber || car.frame || car.serial || car.body || "");
  const mileage = `${formatNumber(car.mileage)} км`;
  const rate = cleanText(car.rate || car.grade || car.score) || "—";
  const auctionImage = cleanText(
    (car as any).auctionSheetImage ||
    (car as any).auctionSheetUrl ||
    (car as any).sheetImage ||
    (car as any).schemeImage ||
    (car as any).sheet ||
    (car as any).auctionSheet ||
    images.auctionSheet ||
    ""
  );

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <SiteTopBar />
      <TopBar backHref={backHref} prevId={prevId} nextId={nextId} />

      <section className="mx-auto max-w-[1800px] px-3 py-2">
        <div className="mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid border-b border-slate-100 bg-gradient-to-b from-white to-slate-50 xl:grid-cols-7">
            <SummaryCell title="Номер лота">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[#b24a1b]">
                  {car.lot || "—"}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(String(car.lot || ""))}
                  className="rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-200"
                >
                  копировать
                </button>
              </div>
              <div className="mt-1 text-xs text-slate-400">☆ ☆ ☆ ☆ ☆</div>

              <div className="lot-inline-nav mt-2 flex flex-wrap items-center gap-1">
                <Link
                  href={backHref || "/catalog"}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700 hover:bg-[#07152f] hover:text-white"
                >
                  Назад
                </Link>

                {prevId ? (
                  <Link
                    href={`/catalog/${prevId}`}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600 hover:bg-slate-200"
                  >
                    Пред.
                  </Link>
                ) : (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-300">
                    Пред.
                  </span>
                )}

                {nextId ? (
                  <Link
                    href={`/catalog/${nextId}`}
                    className="rounded-md bg-[#e6ad87] px-2 py-0.5 text-[10px] font-black text-white hover:bg-[#d8001f]"
                  >
                    След.
                  </Link>
                ) : (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-300">
                    След.
                  </span>
                )}
              </div>
            </SummaryCell>

            <SummaryCell title="Дата / Аукцион">
              <div className="font-black">{car.auctionDate || "—"}</div>
              <div className="mt-1 text-[#07152f]">{car.auction || "—"}</div>
            </SummaryCell>

            <SummaryCell title="Модель / Год">
              <div className="font-black">{title}</div>
              <div className="mt-1">
                <span className="font-black text-[#d8001f]">{car.year || "—"}</span>{" "}
                {cleanText(car.color) || "—"}
              </div>
            </SummaryCell>

            <SummaryCell title="Кузов">
              <div className="font-black">{cleanText(car.body) || "—"}</div>
              <div className="mt-1 text-slate-500">{bodyNumber || "—"}</div>
            </SummaryCell>

            <SummaryCell title="Объем / Комплектация">
              <div>
                <span className="font-black text-[#d8001f]">
                  {cleanText(car.transmission) || "—"}
                </span>{" "}
                {formatNumber(car.engineVolume)} cc
              </div>
              <div className="mt-1 text-slate-500">
                {cleanText(car.complectation || car.equipment) || cleanText(car.drive) || "—"}
              </div>
            </SummaryCell>

            <SummaryCell title="Пробег / Оценка">
              <div className="font-black">{mileage}</div>
              <div className="mt-1 font-black text-amber-600">▲ {rate}</div>
            </SummaryCell>

            <SummaryCell title="Цена">
              <div className="font-black text-green-700">
                {formatPrice(car.averagePrice)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                старт {formatPrice(car.startPrice)}
              </div>
              <div className="text-xs text-slate-500">
                продано {formatPrice(car.finishPrice)}
              </div>
            </SummaryCell>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-3 py-2">
            <Badge>{statusLabel(car.status)}</Badge>
            {isSanction(car) && <Badge tone="amber">санкционный</Badge>}
            {car.leftHandDrive && <Badge tone="blue">LHD</Badge>}
            {cleanText(car.drive) && <Badge tone="gray">{cleanText(car.drive)}</Badge>}
            {cleanText(car.transmission) && <Badge tone="gray">{cleanText(car.transmission)}</Badge>}
          </div>
        </div>

        <LotActionButtons activeAction={activeAction} onAction={handleLotAction} />

        {activeAction === "catalog" && (
          <>
            <FactoryCatalogPanel
            payload={factoryCatalog}
            loading={factoryLoading}
            error={factoryError}
          />
          </>
        )}

        {activeAction === "sales-stats" && (
          <LotSalesStatsPanel car={car} />
        )}

        {activeAction === "calculator" && (
          <LotCalculatorPanel car={car} />
        )}

        <div className={`${activeAction === "content" ? "" : "hidden"} grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.95fr)_320px]`}>
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-base font-black">Фото автомобиля</div>
                <div className="text-sm font-bold text-slate-500">
                  {images.photos.length} фото по лоту
                </div>
              </div>

              <button
                type="button"
                onClick={() => selectedImage && window.open(selectedImage, "_blank")}
                className="rounded-xl bg-[#07152f] px-3 py-1.5 text-xs font-black text-white hover:bg-[#d8001f]"
              >
                Открыть фото
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl bg-slate-100">
              <img
                src={selectedImage || "/mosaic/car-placeholder.png"}
                alt={title}
                className="h-[360px] w-full object-contain"
                onError={(event) => {
                  event.currentTarget.src = "/mosaic/car-placeholder.png";
                }}
              />
            </div>

            <div className="mt-2 grid grid-cols-6 gap-2">
              {images.photos.slice(0, 15).map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`overflow-hidden rounded-xl border bg-white p-1 ${
                    selectedImage === image ? "border-[#d8001f]" : "border-slate-200"
                  }`}
                >
                  <img
                    src={image}
                    alt={title}
                    className="h-12 w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
  <div className="space-y-4">
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-base font-black">Аукционный лист / схема повреждений</div>
                  <div className="text-sm font-bold text-slate-500">
                    Документ из аукциона: лист и отметки по кузову
                  </div>
                </div>

                {auctionImage && (
                  <button
                    type="button"
                    onClick={() => window.open(auctionImage, "_blank")}
                    className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200"
                  >
                    Открыть
                  </button>
                )}
              </div>

              {auctionImage ? (
                <div className="overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={auctionImage}
                    alt="Аукционный лист"
                    className="h-[360px] w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex h-[360px] items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-sm font-bold text-slate-500">
                  Аукционный документ не найден
                </div>
              )}
    </div>

    <AuctionSheetLegendCard />
  </div>
</div>

            {false && images.damageMap && (
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-base font-black">Схема повреждений</div>
                    <div className="text-xs font-bold text-slate-500">
                      Отдельная схема отметок по кузову
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.open(images.damageMap, "_blank")}
                    className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200"
                  >
                    Открыть
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl bg-slate-50">
                  <img
                    src={images.damageMap}
                    alt="Схема повреждений"
                    className="max-h-[220px] w-full object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
            {false && (
              <div />
            )}
          </section>

          <aside className="xl:sticky xl:top-20 xl:self-start">
            {/* Блок "Получить расчёт" временно убран до этапа заявок */}
            <InfoCard title="Цены">
              <InfoRow label="Начальная" value={formatPrice(car.startPrice)} />
              <InfoRow label="Продано за" value={formatPrice(car.finishPrice)} />
              <InfoRow label="Средняя" value={formatPrice(car.averagePrice)} strong />
            </InfoCard>

            <InfoCard title="Характеристики">
              <InfoRow label="Марка" value={car.brand || "—"} />
              <InfoRow label="Модель" value={car.model || "—"} />
              <InfoRow label="Год" value={String(car.year || "—")} />
              <InfoRow label="Кузов" value={cleanText(car.body) || "—"} />
              <InfoRow label="Объем" value={`${formatNumber(car.engineVolume)} cc`} />
              <InfoRow label="КПП" value={cleanText(car.transmission) || "—"} />
              <InfoRow label="Привод" value={cleanText(car.drive) || "—"} />
              <InfoRow label="Цвет" value={cleanText(car.color) || "—"} />
              <InfoRow label="Пробег" value={mileage} />
              <InfoRow label="Оценка" value={rate} />
            </InfoCard>

            <InfoCard title="Аукцион">
              <InfoRow label="Аукцион" value={car.auction || "—"} />
              <InfoRow label="Дата" value={car.auctionDate || "—"} />
              <InfoRow label="Статус" value={statusLabel(car.status)} />
              <InfoRow label="Лот" value={car.lot || "—"} />
            </InfoCard>
          </aside>
        </div>

        

      </section>
    </main>
  );
}

function TopBar({
  backHref,
  prevId,
  nextId,
}: {
  backHref: string;
  prevId: string;
  nextId: string;
}) {
  void backHref;
  void prevId;
  void nextId;

  return null;
}

function SummaryCell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-[72px] border-r border-slate-100 px-3 py-2">
      <div className="mb-1 text-[10px] font-black uppercase tracking-[0.10em] text-slate-500">
        {title}
      </div>
      <div className="text-xs font-bold leading-tight">{children}</div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm first:mt-0">
      <div className="mb-2 text-base font-black">{title}</div>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-1.5 first:border-t-0">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div
        className={`text-right text-xs ${
          strong ? "font-black text-green-700" : "font-bold text-slate-950"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Badge({
  children,
  tone = "gray",
}: {
  children: ReactNode;
  tone?: "gray" | "amber" | "blue";
}) {
  const className = {
    gray: "bg-slate-100 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
  }[tone];

  return (
    <span className={`rounded-xl px-3 py-1 text-xs font-black ring-1 ${className}`}>
      {children}
    </span>
  );
}
