import type { Metadata } from "next";
import SiteTopBar from "@/components/SiteTopBar";
import CatalogFull from "@/components/CatalogFull";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const runtime = "nodejs";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilters = Object.values(params || {}).some((value) =>
    Array.isArray(value) ? value.some(Boolean) : Boolean(value)
  );

  return {
    title: "Статистика продаж авто с аукционов Японии",
    description:
      "Статистика продаж японских автоаукционов: цены проданных автомобилей, пробег, год, оценка и другие параметры для сравнения рынка.",
    alternates: {
      canonical: "/statistics",
    },
    robots: hasFilters
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      url: "/statistics",
      title: "Статистика продаж авто с аукционов Японии | MosaicAuto",
      description:
        "Сравнивайте реальные продажи автомобилей с японских аукционов по году, пробегу, оценке и цене.",
    },
  };
}

export default function StatisticsPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Японии", path: "/japan" },
          { name: "Статистика продаж", path: "/statistics" },
        ])}
      />
      <SiteTopBar />
      <CatalogFull />
    </>
  );
}
