import type { Metadata } from "next";
import HomeLanding from "@/components/HomeLanding";

export const metadata: Metadata = {
  title: "Авто из Японии и Китая под заказ",
  description:
    "Автомобили из Японии и Китая: реальные предложения, аукционные лоты, статистика продаж и автоматический расчёт итоговой стоимости.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Авто из Японии и Китая под заказ | MosaicAuto",
    description:
      "Реальные предложения автомобилей из Японии и Китая, статистика продаж и расчёт стоимости до покупки.",
  },
};

export default function Home() {
  return <HomeLanding />;
}
