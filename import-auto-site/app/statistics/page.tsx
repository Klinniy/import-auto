import StatisticsSalesPage from "@/components/StatisticsSalesPage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Статистика продаж авто из Японии | MosaicAuto",
  description: "Статистика продаж японских автоаукционов: марки, модели, цены и данные по проданным автомобилям.",
};

export default function StatisticsPage() {
  return <StatisticsSalesPage />;
}
