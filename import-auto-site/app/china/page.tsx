import type { Metadata } from "next";
import SiteTopBar from "@/components/SiteTopBar";
import ChinaCatalogExactClone from "@/components/ChinaCatalogExactClone";
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
    title: "Авто из Китая под заказ с доставкой",
    description:
      "Каталог автомобилей из Китая: актуальные предложения, характеристики, фотографии и калькулятор ориентировочной итоговой стоимости.",
    alternates: {
      canonical: "/china",
    },
    robots: hasFilters
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      url: "/china",
      title: "Авто из Китая под заказ с доставкой | MosaicAuto",
      description:
        "Актуальные автомобили из Китая, данные по машинам и расчёт ориентировочной итоговой стоимости.",
    },
  };
}

export default function ChinaPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Китая", path: "/china" },
        ])}
      />
      <SiteTopBar />
      <ChinaCatalogExactClone />
    </>
  );
}
