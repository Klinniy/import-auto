import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

type CarImage = {
  original?: string;
  preview?: string;
  medium?: string;
};

type Car = {
  id: string;
  lot?: string;
  brand?: string;
  model?: string;
  year?: number | string | null;
  body?: string;
  auction?: string;
  auctionDate?: string;
  grade?: string;
  color?: string;
  transmission?: string;
  transmissionType?: number | string | null;
  drive?: string;
  mileage?: number | string | null;
  engineVolume?: number | string | null;
  horsePower?: number | string | null;
  rate?: string | number | null;
  startPrice?: number | string | null;
  finishPrice?: number | string | null;
  averagePrice?: number | string | null;
  status?: string;
  sanction?: boolean;
  leftHandDrive?: boolean;
  previewImage?: string;
  images?: Array<string | CarImage>;
  imagesCount?: number;
  info?: string;
  serial?: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ApiResponse = {
  ok?: boolean;
  data?: Car | null;
  car?: Car | null;
  item?: Car | null;
  error?: string;
};

function pickCar(payload: ApiResponse | Car): Car | null {
  /*
    /api/car/[id] возвращает wrapper:
    { ok: true, id: "...", data: car }

    Поэтому сначала проверяем data/car/item.
    Нельзя принимать объект только по наличию id, иначе wrapper становится "автомобилем".
  */
  const wrapped = payload as ApiResponse;

  if (wrapped.data || wrapped.car || wrapped.item) {
    return wrapped.data || wrapped.car || wrapped.item || null;
  }

  const maybeCar = payload as Car;

  if (maybeCar.brand || maybeCar.model || maybeCar.lot) {
    return maybeCar;
  }

  return null;
}

function siteBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

async function getCar(id: string) {
  try {
    const res = await fetch(`${siteBaseUrl()}/api/car/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return pickCar(await res.json());
  } catch {
    return null;
  }
}

function imageList(car: Car): string[] {
  const result: string[] = [];

  if (Array.isArray(car.images)) {
    for (const item of car.images) {
      if (!item) continue;

      if (typeof item === "string") {
        result.push(item);
        continue;
      }

      result.push(item.original || item.medium || item.preview || "");
    }
  }

  if (car.previewImage) {
    result.push(car.previewImage);
  }

  return Array.from(new Set(result.filter(Boolean)));
}

function formatNumber(value?: number | string | null) {
  if (value === undefined || value === null || value === "") return "—";

  const num = Number(value);

  if (!Number.isFinite(num)) return String(value);

  return new Intl.NumberFormat("ru-RU").format(num);
}

function formatPrice(value?: number | string | null) {
  const num = Number(value);

  if (!Number.isFinite(num) || num <= 0) return "—";

  return `¥ ${formatNumber(num)}`;
}

function cleanHtmlText(value: unknown) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function valueText(value?: number | string | boolean | null) {
  if (value === undefined || value === null || value === "") return "—";

  if (typeof value === "boolean") {
    return value ? "Да" : "Нет";
  }

  return String(value);
}

function cleanBadge(value: unknown) {
  const text = String(value ?? "").trim();

  if (!text || text === "-" || text === "—") return "";

  if (
    text.length > 12 ||
    text.includes("http") ||
    text.includes("{") ||
    text.includes("[") ||
    text.includes("#") ||
    text.includes("&w=") ||
    text.includes("&h=")
  ) {
    return "";
  }

  return text;
}

function splitLotImages(images: string[]) {
  /*
    У части лотов первое изображение — аукционный лист.
    Для пользователя в главном блоке лучше показывать фото автомобиля.
    Поэтому при наличии нескольких фото основным делаем второе изображение,
    а первое показываем отдельным блоком как аукционный лист.
  */
  if (images.length <= 1) {
    return {
      mainImage: images[0] || "",
      auctionSheet: "",
      galleryImages: images,
    };
  }

  return {
    mainImage: images[1] || images[0],
    auctionSheet: images[0],
    galleryImages: images.slice(1),
  };
}

export default async function CarPage({ params }: PageProps) {
  const { id } = await params;
  const car = await getCar(id);

  if (!car) notFound();

  const images = imageList(car);
  const { mainImage, auctionSheet, galleryImages } = splitLotImages(images);
  const title = `${car.brand || "AUTO"} ${car.model || ""}`.trim();
  const rate = cleanBadge(car.rate || car.grade);

  const mainSpecs: Array<[string, string | number | boolean | null | undefined]> = [
    ["Год", car.year],
    ["Кузов", cleanHtmlText(car.body)],
    ["Пробег", car.mileage ? `${formatNumber(car.mileage)} км` : ""],
    ["Объем", car.engineVolume ? `${formatNumber(car.engineVolume)} см³` : ""],
    ["Мощность", car.horsePower ? `${formatNumber(car.horsePower)} л.с.` : ""],
    ["КПП", car.transmission],
    ["Привод", car.drive],
    ["Цвет", car.color],
  ];

  const auctionSpecs: Array<[string, string | number | boolean | null | undefined]> = [
    ["Лот", car.lot || car.id],
    ["Аукцион", car.auction],
    ["Дата торгов", car.auctionDate],
    ["Оценка", car.rate || car.grade],
    ["Статус", car.status],
    ["Санкционный", car.sanction],
    ["Левый руль", car.leftHandDrive],
    ["Серийный номер", car.serial],
  ];

  return (
    <main className="min-h-screen bg-[#eef3fa] text-[#07152f]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-[-0.04em]">
            MOSAIC<span className="text-[#ff2d3d]">AUTO</span>
          </Link>

          <div className="hidden rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 md:block">
            Лот {car.lot || car.id}
          </div>

          <Link
            href="/catalog"
            className="rounded-2xl bg-[#07152f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff2d3d]"
          >
            ← В каталог
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1480px] px-5 py-8 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_430px]">
          <div className="min-w-0">
            <div className="mb-6 rounded-[2rem] bg-[#07152f] p-7 text-white shadow-2xl shadow-slate-300/70 lg:p-9">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-200">
                  автомобиль из Японии
                </span>

                {rate && (
                  <span className="rounded-full bg-[#ff2d3d] px-4 py-2 text-xs font-black text-white">
                    Оценка {rate}
                  </span>
                )}

                {car.sanction && (
                  <span className="rounded-full bg-yellow-400 px-4 py-2 text-xs font-black text-[#07152f]">
                    санкц.
                  </span>
                )}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] md:text-6xl">
                {title}
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/65">
                Лот {car.lot || car.id}
                {car.auction ? ` · ${car.auction}` : ""}
                {car.auctionDate ? ` · ${car.auctionDate}` : ""}
              </p>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/80 ring-1 ring-slate-200">
              <div className="relative h-[360px] bg-slate-100 md:h-[520px]">
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={title}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-8xl">
                    🚗
                  </div>
                )}
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {galleryImages.slice(1, 9).map((image) => (
                  <div
                    key={image}
                    className="relative h-32 overflow-hidden rounded-[1.4rem] bg-white shadow-lg shadow-slate-200/70 ring-1 ring-slate-200 md:h-36"
                  >
                    <Image
                      src={image}
                      alt={`${title} фото`}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {auctionSheet && (
              <section className="mt-6 rounded-[2rem] bg-white p-7 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200">
                <h2 className="text-2xl font-black tracking-[-0.03em]">
                  Аукционный лист
                </h2>

                <div className="relative mt-5 h-[420px] overflow-hidden rounded-[1.5rem] bg-slate-100 md:h-[560px]">
                  <Image
                    src={auctionSheet}
                    alt={`Аукционный лист ${title}`}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="object-contain"
                  />
                </div>
              </section>
            )}

            {car.info && (
              <section className="mt-6 rounded-[2rem] bg-white p-7 shadow-lg shadow-slate-200/70 ring-1 ring-slate-200">
                <h2 className="text-2xl font-black tracking-[-0.03em]">
                  Информация по лоту
                </h2>
                <p className="mt-4 whitespace-pre-wrap text-slate-600">{car.info}</p>
              </section>
            )}
          </div>

          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/80 ring-1 ring-slate-200 lg:sticky lg:top-24">
            <div className="rounded-[1.5rem] bg-slate-50 p-5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                цены аукциона
              </div>

              <div className="mt-4 grid gap-4">
                <div>
                  <div className="text-sm font-bold text-slate-400">Старт</div>
                  <div className="text-2xl font-black">{formatPrice(car.startPrice)}</div>
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-400">Финиш</div>
                  <div className="text-2xl font-black">{formatPrice(car.finishPrice)}</div>
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-400">Средняя цена</div>
                  <div className="text-2xl font-black">{formatPrice(car.averagePrice)}</div>
                </div>
              </div>
            </div>

            <button className="mt-5 w-full rounded-2xl bg-[#ff2d3d] px-5 py-4 font-black text-white shadow-lg shadow-red-200 transition hover:bg-[#e51d2d]">
              Получить расчет
            </button>

            <Link
              href="/catalog"
              className="mt-3 flex w-full justify-center rounded-2xl bg-[#07152f] px-5 py-4 font-black text-white transition hover:bg-slate-800"
            >
              Вернуться в каталог
            </Link>

            <section className="mt-6">
              <h2 className="text-xl font-black tracking-[-0.03em]">
                Характеристики
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {mainSpecs.map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-bold text-slate-400">{label}</div>
                    <div className="mt-1 font-black">{valueText(value)}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6">
              <h2 className="text-xl font-black tracking-[-0.03em]">
                Аукционный блок
              </h2>

              <div className="mt-4 grid gap-3">
                {auctionSpecs.map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4"
                  >
                    <div className="text-sm font-bold text-slate-400">{label}</div>
                    <div className="max-w-[60%] text-right font-black">
                      {valueText(value)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
