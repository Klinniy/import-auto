import SiteTopBar from "@/components/SiteTopBar";
import CatalogFull from "@/components/CatalogFull";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Статистика продаж авто из Японии | MosaicAuto",
  description:
    "Статистика продаж японских автоаукционов в формате каталога: фильтры, таблица, цены, пробег и карточки проданных лотов.",
};

export default function StatisticsPage() {
  return (
    <>
      <SiteTopBar />
      <CatalogFull />
    </>
  );
}
