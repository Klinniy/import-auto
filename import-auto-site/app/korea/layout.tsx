import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Авто из Кореи — раздел готовится",
  description:
    "Раздел автомобилей из Кореи находится в разработке. После запуска здесь появятся каталог и расчёт стоимости.",
  alternates: {
    canonical: "/korea",
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function KoreaLayout({ children }: { children: ReactNode }) {
  return children;
}
