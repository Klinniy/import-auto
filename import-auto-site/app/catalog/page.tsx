import type { Metadata } from "next";
import SiteTopBar from "@/components/SiteTopBar";
import CatalogFull from "@/components/CatalogFull";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

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
    title: "Каталог авто с аукционов Японии",
    description:
      "Каталог актуальных автомобилей с японских аукционов: поиск по марке, модели, году, пробегу и другим параметрам.",
    alternates: {
      canonical: "/catalog",
    },
    robots: hasFilters
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      url: "/catalog",
      title: "Каталог авто с аукционов Японии | MosaicAuto",
      description:
        "Актуальные автомобили с японских аукционов с фотографиями, характеристиками и данными лотов.",
    },
  };
}

export default function CatalogPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Авто из Японии", path: "/japan" },
          { name: "Каталог", path: "/catalog" },
        ])}
      />
      <SiteTopBar />
      <CatalogFull />
    </>
  );
}
