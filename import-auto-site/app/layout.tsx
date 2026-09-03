import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HardHomeNavigation from "@/components/HardHomeNavigation";
import ManagerContactHub from "@/components/ManagerContactHub";
import SeoJsonLd from "@/components/SeoJsonLd";
import { SITE_URL, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MosaicAuto — авто из Японии и Китая под заказ",
    template: "%s | MosaicAuto",
  },
  description:
    "Автомобили из Японии и Китая: актуальные предложения, аукционные лоты, статистика продаж, калькулятор стоимости и доставка в Россию.",
  applicationName: "MosaicAuto",
  category: "Автомобили",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "MosaicAuto",
    url: SITE_URL,
    title: "MosaicAuto — авто из Японии и Китая под заказ",
    description:
      "Автомобили из Японии и Китая: актуальные предложения, статистика продаж и расчёт итоговой стоимости.",
  },
  twitter: {
    card: "summary",
    title: "MosaicAuto — авто из Японии и Китая под заказ",
    description:
      "Автомобили из Японии и Китая: актуальные предложения, статистика продаж и расчёт итоговой стоимости.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SeoJsonLd data={organizationJsonLd} />
        <SeoJsonLd data={websiteJsonLd} />
        {children}
        <HardHomeNavigation />
        <ManagerContactHub />
      </body>
    </html>
  );
}
