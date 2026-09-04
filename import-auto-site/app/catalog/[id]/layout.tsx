import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cache } from "react";
import { notFound } from "next/navigation";
import JapanLotLeadCta from "@/components/JapanLotLeadCta";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd, carJsonLd } from "@/lib/seo";
import { getJapanLotServer } from "@/lib/seo/catalog-data";

type Params = Promise<{ id: string }> | { id: string };

const getLot = cache(async (id: string) => getJapanLotServer(id));

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function lotName(car: any) {
  return [clean(car?.brand), clean(car?.model), car?.year ? clean(car.year) : ""]
    .filter(Boolean)
    .join(" ") || "Автомобиль из Японии";
}

function lotDescription(car: any) {
  const details = [
    car?.lot ? `лот ${clean(car.lot)}` : "",
    Number(car?.mileage) > 0
      ? `пробег ${new Intl.NumberFormat("ru-RU").format(Number(car.mileage))} км`
      : "",
    Number(car?.engineVolume) > 0
      ? `двигатель ${new Intl.NumberFormat("ru-RU").format(Number(car.engineVolume))} см³`
      : "",
    car?.auction ? `аукцион ${clean(car.auction)}` : "",
  ].filter(Boolean);

  return `${lotName(car)} с аукциона Японии${details.length ? `: ${details.join(", ")}` : ""}. Фото, характеристики, статистика продаж и ориентировочный расчёт стоимости на MosaicAuto.`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const id = clean(p?.id);
  const car = id ? await getLot(id) : null;

  if (!car) {
    return {
      title: "Лот не найден",
      robots: { index: false, follow: false },
    };
  }

  const name = lotName(car);
  const lot = clean(car.lot || id);
  const canonical = `/catalog/${encodeURIComponent(id)}`;
  const image = clean(car.previewImage);
  const description = lotDescription(car);

  return {
    title: `${name} — лот ${lot}`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${name} — лот ${lot} | MosaicAuto`,
      description,
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
  };
}

export default async function JapanLotLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  const p = await params;
  const id = clean(p?.id);
  const car = id ? await getLot(id) : null;

  if (!car) notFound();

  const name = lotName(car);
  const path = `/catalog/${encodeURIComponent(id)}`;

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Японии", path: "/japan" },
          { name: "Каталог", path: "/catalog" },
          { name, path },
        ])}
      />
      <SeoJsonLd
        data={carJsonLd({
          name,
          path,
          lot: car.lot || id,
          brand: car.brand,
          model: car.model,
          year: car.year,
          mileage: car.mileage,
          engineVolume: car.engineVolume,
          transmission: car.transmission,
          drive: car.drive,
          color: car.color,
          image: car.previewImage,
          auction: car.auction,
          grade: car.grade || car.rate,
        })}
      />
      {children}
      <JapanLotLeadCta />
    </>
  );
}
