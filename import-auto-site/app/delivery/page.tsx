import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoShell, { InfoCard } from "@/components/PublicInfoShell";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Доставка автомобилей из Японии и Китая",
  description:
    "Как устроена доставка автомобиля из Японии или Китая: покупка, отправка в Россию, таможенное оформление, лаборатория и доставка в город назначения.",
  alternates: { canonical: "/delivery" },
  openGraph: {
    url: "/delivery",
    title: "Доставка автомобилей из Японии и Китая | MosaicAuto",
    description: "Основные этапы доставки автомобиля после покупки и что влияет на итоговый маршрут и стоимость.",
  },
};

const stages = [
  ["1", "Покупка автомобиля", "После выбора и согласования покупается конкретный автомобиль: для Японии это может быть покупка на аукционе, для Китая — оформление выбранного предложения."],
  ["2", "Отправка в Россию", "После покупки автомобиль проходит этапы подготовки и отправки. Конкретный маршрут зависит от страны, автомобиля и логистической схемы."],
  ["3", "Таможенное оформление", "После прибытия автомобиль проходит необходимые таможенные процедуры."],
  ["4", "Лаборатория и оформление", "После таможни выполняются необходимые процедуры лаборатории и последующего оформления автомобиля."],
  ["5", "Доставка в город назначения", "При необходимости автомобиль отправляется дальше в город, который согласован с клиентом."],
  ["6", "Получение автомобиля", "Финальный этап — передача автомобиля клиенту после завершения обязательных процедур и доставки."],
];

export default function DeliveryPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Доставка", path: "/delivery" },
        ])}
      />
      <PublicInfoShell
        eyebrow="Доставка"
        title="Что происходит с автомобилем после покупки"
        intro="Маршрут отличается для Японии и Китая, но общий принцип один: покупка, отправка в Россию, обязательные процедуры и доставка до согласованного города."
      >
        <InfoCard title="Основные этапы">
          <div className="grid gap-4 md:grid-cols-2">
            {stages.map(([number, title, text]) => (
              <article key={number} className="rounded-2xl bg-[#f7f9fc] p-5 ring-1 ring-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#07152f] text-sm font-black text-white">{number}</div>
                <h3 className="mt-4 text-lg font-black text-[#07152f]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </InfoCard>

        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard title="Что влияет на маршрут и стоимость">
            <p>
              Страна покупки, место нахождения автомобиля, его характеристики, выбранный город получения и актуальные расходы по конкретной перевозке.
            </p>
            <p className="mt-3">
              Поэтому калькулятор на сайте показывает ориентировочную стоимость, а детали по выбранному автомобилю лучше подтверждать перед покупкой.
            </p>
          </InfoCard>

          <InfoCard title="Что посмотреть до связи с менеджером">
            <p>
              Сначала выберите конкретный автомобиль и откройте калькулятор. Так разговор будет идти уже по реальному лоту или предложению, а не по абстрактной модели.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/calculator/japan" className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-[#07152f] hover:bg-[#07152f] hover:text-white">
                Калькулятор Японии
              </Link>
              <Link href="/calculator/china" className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-[#07152f] hover:bg-[#07152f] hover:text-white">
                Калькулятор Китая
              </Link>
            </div>
          </InfoCard>
        </div>

        <InfoCard title="Сроки доставки">
          <p>
            Универсальный срок для любого автомобиля на сайте не указываем: он зависит от маршрута, даты покупки, обязательных процедур и города назначения. Актуальный ориентир нужно уточнять по конкретной машине.
          </p>
        </InfoCard>
      </PublicInfoShell>
    </>
  );
}
