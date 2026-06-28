"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

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

  const damageMap = images[0] || "";

  // Полный аукционный лист нельзя определять просто как "последняя картинка",
  // потому что у части лотов туда приходит NO FOTO.
  // Пока не нашли надежный признак полного листа, не показываем фейковую заглушку.
  const possibleSheet = images.find((url, index) => index > 0 && looksLikeAuctionSheet(url)) || "";

  const photos = images.filter((url, index) => {
    if (index === 0) return false;
    if (possibleSheet && url === possibleSheet) return false;
    return true;
  });

  return {
    damageMap,
    auctionSheet: possibleSheet,
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

export default function LotDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : String(rawId || "");

  const prevId = "";
  const nextId = "";

  const [car, setCar] = useState<Car | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const images = useMemo(() => splitImages(car || {}), [car]);
  const title = car ? carTitle(car) : "Лот";

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError("");

    fetch(`/api/car/${encodeURIComponent(id)}`, { cache: "no-store" })
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
          nextImages.auctionSheet ||
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
        <TopBar prevId={prevId} nextId={nextId} />
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
        <TopBar prevId={prevId} nextId={nextId} />
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
  const auctionImage = images.auctionSheet || images.damageMap || "";

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <TopBar prevId={prevId} nextId={nextId} />

      <section className="mx-auto max-w-[1800px] px-3 py-3">
        <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.95fr)_320px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-base font-black">Фото автомобиля</div>
                <div className="text-sm font-bold text-slate-500">
                  {images.photos.length || images.all.length} фото по лоту
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
              {(images.photos.length ? images.photos : images.all).slice(0, 15).map((image) => (
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
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-base font-black">Получить расчёт</div>
              <div className="mt-1 text-sm font-bold text-slate-500">
                Рассчитаем стоимость авто до вашего города.
              </div>

              <div className="mt-3 grid gap-2">
                <input
                  placeholder="Ваше имя"
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-[#2f80ed]"
                />
                <input
                  placeholder="Телефон"
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-[#2f80ed]"
                />
                <input
                  placeholder="Город доставки"
                  className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold outline-none focus:border-[#2f80ed]"
                />

                <button className="mt-1 rounded-xl bg-[#d8001f] px-4 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white hover:brightness-105">
                  Получить расчёт
                </button>
              </div>
            </div>

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

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <InfoCard title="Комментарии / примечания">
            <div className="min-h-[60px] whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
              {cleanText(car.comment || car.notes) || "Дополнительные комментарии по лоту не переданы API."}
            </div>
          </InfoCard>

          <InfoCard title="Следующий этап">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
              Здесь позже можно добавить похожие автомобили, статистику продаж и расширенный расчёт стоимости.
            </div>
          </InfoCard>
        </div>
      </section>
    </main>
  );
}

function TopBar({ prevId, nextId }: { prevId: string; nextId: string }) {
  return (
    <header className="border-t-4 border-[#d8001f] border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-10 max-w-[1800px] items-center justify-between gap-2 px-3">
        <div className="flex items-center gap-2">
          <Link
            href="/catalog"
            className="rounded bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 hover:bg-[#07152f] hover:text-white"
          >
            Назад в каталог
          </Link>

          {prevId ? (
            <Link
              href={`/catalog/${prevId}`}
              className="rounded bg-[#e6ad87] px-2.5 py-1 text-xs font-black text-white"
            >
              Предыдущий
            </Link>
          ) : (
            <button
              disabled
              className="rounded bg-slate-200 px-2.5 py-1 text-xs font-black text-slate-400"
            >
              Предыдущий
            </button>
          )}

          {nextId ? (
            <Link
              href={`/catalog/${nextId}`}
              className="rounded bg-[#e6ad87] px-2.5 py-1 text-xs font-black text-white"
            >
              Следующий
            </Link>
          ) : (
            <button
              disabled
              className="rounded bg-slate-200 px-2.5 py-1 text-xs font-black text-slate-400"
            >
              Следующий
            </button>
          )}

          <div className="ml-2 hidden text-sm font-black text-slate-600 md:block">
            TOKYO <span className="text-[#497b00]">{tokyoTime()}</span>
          </div>
        </div>

        <Link
          href="/"
          className="rounded bg-[#07152f] px-3 py-1.5 text-xs font-black text-white hover:bg-[#d8001f]"
        >
          На главную
        </Link>
      </div>
    </header>
  );
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
