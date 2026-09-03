import type { Metadata } from "next";
import JapanStandaloneCalculator from "@/components/JapanStandaloneCalculator";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Калькулятор стоимости авто из Японии",
  description:
    "Рассчитайте ориентировочную итоговую стоимость автомобиля из Японии с учётом покупки, доставки, таможенного оформления и основных расходов.",
  alternates: {
    canonical: "/calculator/japan",
  },
  openGraph: {
    url: "/calculator/japan",
    title: "Калькулятор стоимости авто из Японии | MosaicAuto",
    description:
      "Автоматический расчёт ориентировочной стоимости автомобиля из Японии до покупки.",
  },
};

export default function JapanCalculatorPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Японии", path: "/japan" },
          { name: "Калькулятор", path: "/calculator/japan" },
        ])}
      />
      <JapanStandaloneCalculator />
    </>
  );
}
