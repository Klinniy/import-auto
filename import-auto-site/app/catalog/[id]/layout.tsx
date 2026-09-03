import type { Metadata } from "next";
import type { ReactNode } from "react";
import JapanLotLeadCta from "@/components/JapanLotLeadCta";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

type Params = Promise<{ id: string }> | { id: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await params;
  const id = String(p?.id || "").trim();
  const canonical = `/catalog/${encodeURIComponent(id)}`;

  return {
    title: id ? `Автомобиль из Японии — лот ${id}` : "Автомобиль из Японии",
    description: id
      ? `Аукционный лот ${id} из Японии: фотографии, характеристики, данные автомобиля, статистика продаж и расчёт ориентировочной стоимости.`
      : "Автомобиль с японского аукциона: фотографии, характеристики, статистика продаж и расчёт ориентировочной стоимости.",
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: id ? `Автомобиль из Японии — лот ${id} | MosaicAuto` : "Автомобиль из Японии | MosaicAuto",
      description: "Фотографии, характеристики, данные аукционного лота и расчёт ориентировочной стоимости автомобиля из Японии.",
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
  const id = String(p?.id || "").trim();
  const path = `/catalog/${encodeURIComponent(id)}`;

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Японии", path: "/japan" },
          { name: "Каталог", path: "/catalog" },
          { name: id ? `Лот ${id}` : "Автомобиль", path },
        ])}
      />
      {children}
      <JapanLotLeadCta />
    </>
  );
}
