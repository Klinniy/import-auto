import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoShell, { InfoCard } from "@/components/PublicInfoShell";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "О MosaicAuto",
  description:
    "MosaicAuto — сервис для поиска автомобилей из Японии и Китая: каталоги, данные лотов, статистика продаж, калькуляторы и помощь менеджера.",
  alternates: { canonical: "/about" },
  openGraph: {
    url: "/about",
    title: "О MosaicAuto | MosaicAuto",
    description:
      "Как устроен MosaicAuto и какие данные доступны при выборе автомобиля из Японии или Китая.",
  },
};

export default function AboutPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "О MosaicAuto", path: "/about" },
        ])}
      />
      <PublicInfoShell
        eyebrow="О сервисе"
        title="MosaicAuto — выбор автомобиля до принятия решения о покупке"
        intro="Мы собрали в одном интерфейсе данные по автомобилям из Японии и Китая, инструменты расчёта и понятный путь от выбора машины до связи с менеджером."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <InfoCard title="Что есть на сайте">
            <p>
              Для Японии доступны актуальные аукционные лоты, статистика продаж и калькулятор ориентировочной стоимости. Для Китая — каталог актуальных предложений и отдельный калькулятор.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/japan" className="rounded-xl bg-[#07152f] px-4 py-3 text-sm font-black text-white hover:bg-[#ff2d3d]">
                Авто из Японии →
              </Link>
              <Link href="/china" className="rounded-xl bg-[#07152f] px-4 py-3 text-sm font-black text-white hover:bg-[#ff2d3d]">
                Авто из Китая →
              </Link>
            </div>
          </InfoCard>

          <InfoCard title="На чём основан выбор">
            <p>
              Мы показываем информацию, которая приходит из источников каталогов: фотографии, характеристики, пробег, оценку, данные лота и аукционный лист — когда конкретное поле доступно для автомобиля.
            </p>
            <p className="mt-3">
              Итоговые решения лучше принимать после проверки конкретного автомобиля и обсуждения условий покупки.
            </p>
          </InfoCard>
        </div>

        <InfoCard title="Как мы предлагаем работать с сайтом">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["1", "Найдите автомобиль", "Используйте каталог, фильтры, страницы марок и моделей."],
              ["2", "Оцените бюджет", "Посмотрите доступные данные и ориентировочный расчёт стоимости."],
              ["3", "Обсудите конкретный вариант", "Передайте менеджеру ссылку или номер лота для следующего шага."],
            ].map(([number, title, text]) => (
              <div key={number} className="rounded-2xl bg-[#f7f9fc] p-5 ring-1 ring-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff2d3d] text-sm font-black text-white">{number}</div>
                <h3 className="mt-4 text-lg font-black text-[#07152f]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </InfoCard>
      </PublicInfoShell>
    </>
  );
}
