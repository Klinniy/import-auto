import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

type Car = {
  id: string;
  lot?: string;
  brand?: string;
  model?: string;
  year?: number | string;
  body?: string;
  auction?: string;
  auctionDate?: string;
  grade?: string;
  color?: string;
  transmission?: string;
  drive?: string;
  mileage?: number | string;
  engineVolume?: number | string;
  horsePower?: number | string;
  rate?: string | number;
  startPrice?: number | string;
  finishPrice?: number | string;
  averagePrice?: number | string;
  previewImage?: string;
  images?: string[];
  info?: string;
  serial?: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ApiResponse = {
  data?: Car;
  car?: Car;
  item?: Car;
};

function pickCar(payload: ApiResponse | Car): Car | null {
  if ("id" in payload) return payload;
  return payload.data || payload.car || payload.item || null;
}

async function getCar(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/car/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return pickCar(await res.json());
  } catch {
    return null;
  }
}

function imageList(car: Car) {
  const result = car.images?.length ? car.images : car.previewImage ? [car.previewImage] : [];
  return result.filter(Boolean);
}

export default async function CarPage({ params }: PageProps) {
  const { id } = await params;
  const car = await getCar(id);

  if (!car) notFound();

  const images = imageList(car);

  const specs = [
    ["Год", car.year],
    ["Кузов", car.body],
    ["Аукцион", car.auction],
    ["Дата", car.auctionDate],
    ["Оценка", car.rate || car.grade],
    ["Цвет", car.color],
    ["КПП", car.transmission],
    ["Привод", car.drive],
    ["Пробег", car.mileage],
    ["Объем", car.engineVolume],
    ["Мощность", car.horsePower],
    ["Серийный номер", car.serial],
  ];

  return (
    <main className="min-h-screen bg-[#08090d] px-4 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/catalog" className="text-sm font-bold text-red-300">
          ← В каталог
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="relative h-[480px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5">
              {images[0] ? (
                <Image
                  src={images[0]}
                  alt={`${car.brand || "Автомобиль"} ${car.model || ""}`}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-8xl">
                  🚗
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.slice(1, 5).map((image) => (
                  <div key={image} className="relative h-28 overflow-hidden rounded-2xl bg-white/5">
                    <Image
                      src={image}
                      alt="Фото автомобиля"
                      fill
                      unoptimized
                      sizes="25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-7">
            <div className="text-sm font-black uppercase tracking-[0.24em] text-red-300">
              Лот {car.lot || car.id}
            </div>

            <h1 className="mt-4 text-5xl font-black tracking-[-0.05em]">
              {car.brand || "AUTO"} {car.model || ""}
            </h1>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {specs.map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/5 p-4">
                  <div className="text-sm text-white/35">{label}</div>
                  <div className="mt-1 font-black">{value || "—"}</div>
                </div>
              ))}
            </div>

            <button className="mt-6 w-full rounded-2xl bg-red-600 px-5 py-4 font-black text-white transition hover:bg-red-700">
              Получить расчет
            </button>
          </div>
        </div>

        {car.info && (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
            <h2 className="text-2xl font-black">Информация по лоту</h2>
            <p className="mt-4 whitespace-pre-wrap text-white/60">{car.info}</p>
          </section>
        )}
      </div>
    </main>
  );
}
