// @ts-nocheck
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import ChinaLotTabs from "@/components/ChinaLotTabs";
import SeoJsonLd from "@/components/SeoJsonLd";
import { getChinaLot } from "@/lib/china/catalog";
import { breadcrumbJsonLd, carJsonLd } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }> | { id: string };

const getLot = cache(async (id: string) => getChinaLot(id));

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function lotName(car: any) {
  return [clean(car?.brand), clean(car?.model), clean(car?.year)]
    .filter(Boolean)
    .join(" ") || "Автомобиль из Китая";
}

function lotDescription(car: any) {
  const details = [
    car?.lot ? `лот ${clean(car.lot)}` : "",
    car?.mileage ? `пробег ${new Intl.NumberFormat("ru-RU").format(Number(car.mileage))} км` : "",
    car?.engineVolume ? `двигатель ${new Intl.NumberFormat("ru-RU").format(Number(car.engineVolume))} см³` : "",
  ].filter(Boolean);

  return `${lotName(car)} из Китая${details.length ? `: ${details.join(", ")}` : ""}. Фото, характеристики и ориентировочный расчёт стоимости на MosaicAuto.`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const car = await getLot(p.id);

  if (!car) {
    return {
      title: "Лот не найден",
      robots: { index: false, follow: false },
    };
  }

  const name = lotName(car);
  const canonical = `/china/${encodeURIComponent(p.id)}`;
  const image = clean(car.previewImage || car.image);

  return {
    title: `${name} — авто из Китая`,
    description: lotDescription(car),
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${name} — авто из Китая | MosaicAuto`,
      description: lotDescription(car),
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
  };
}

export default async function ChinaLotPage({
  params,
}: {
  params: Params;
}) {
  const p = await params;
  const car = await getLot(p.id);

  if (!car) notFound();

  const name = lotName(car);
  const path = `/china/${encodeURIComponent(p.id)}`;

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Китая", path: "/china" },
          { name, path },
        ])}
      />
      <SeoJsonLd
        data={carJsonLd({
          name,
          path,
          lot: car.lot || p.id,
          brand: car.brand,
          model: car.model,
          year: car.year,
          mileage: car.mileage,
          engineVolume: car.engineVolume,
          transmission: car.transmission,
          drive: car.drive,
          color: car.color,
          image: car.previewImage || car.image,
          auction: car.auction,
          grade: car.grade || car.rate,
        })}
      />

      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link
            href="/china"
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-[#07152f] hover:text-white"
          >
            ← В каталог Китая
          </Link>

          <Link
            href="/"
            className="rounded-xl bg-[#07152f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff2d3d]"
          >
            На главную
          </Link>
        </div>
      </header>

      <ChinaLotTabs car={car} />
    </main>
  );
}
