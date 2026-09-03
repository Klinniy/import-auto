import type { Metadata } from "next";
import AfaHome from "@/components/AfaHome";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Авто из Японии с аукционов под заказ",
  description:
    "Автомобили из Японии с аукционов: актуальные лоты, фотографии, характеристики, статистика продаж и калькулятор итоговой стоимости.",
  alternates: {
    canonical: "/japan",
  },
  openGraph: {
    url: "/japan",
    title: "Авто из Японии с аукционов под заказ | MosaicAuto",
    description:
      "Актуальные японские аукционные лоты, статистика продаж и расчёт стоимости автомобиля.",
  },
};

export default function JapanPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Японии", path: "/japan" },
        ])}
      />
      <AfaHome />
    </>
  );
}
