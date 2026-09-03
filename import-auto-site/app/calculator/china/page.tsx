import type { Metadata } from "next";
import ImportCalculator from "@/components/ImportCalculator";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Калькулятор стоимости авто из Китая",
  description:
    "Рассчитайте ориентировочную итоговую стоимость автомобиля из Китая с учётом покупки, доставки, таможенного оформления и основных расходов.",
  alternates: {
    canonical: "/calculator/china",
  },
  openGraph: {
    url: "/calculator/china",
    title: "Калькулятор стоимости авто из Китая | MosaicAuto",
    description:
      "Автоматический расчёт ориентировочной стоимости автомобиля из Китая до покупки.",
  },
};

export default function ChinaCalculatorPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Китая", path: "/china" },
          { name: "Калькулятор", path: "/calculator/china" },
        ])}
      />
      <ImportCalculator market="china" />
    </>
  );
}
