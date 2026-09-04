import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoShell from "@/components/PublicInfoShell";

export const metadata: Metadata = {
  title: "Как купить автомобиль",
  description: "Как выбрать автомобиль из Японии или Китая, рассчитать стоимость, проверить основные данные и пройти этапы покупки и доставки.",
};

const chooseSteps = [
  {
    title: "Выберите рынок",
    text: "Откройте каталог Японии или Китая. Для Японии доступны аукционные лоты и статистика продаж, для Китая — актуальные предложения автомобилей.",
  },
  {
    title: "Настройте поиск",
    text: "Укажите марку, модель, год и другие параметры, которые важны именно вам.",
  },
  {
    title: "Изучите автомобиль",
    text: "Посмотрите фотографии, пробег, характеристики, оценку и аукционный лист, когда эти данные доступны в источнике.",
  },
  {
    title: "Посмотрите статистику",
    text: "Для японских автомобилей можно сравнить реальные продажи машин похожего года, состояния и пробега.",
  },
  {
    title: "Откройте калькулятор",
    text: "Вам не нужно самостоятельно складывать расходы. Укажите параметры автомобиля — калькулятор автоматически покажет ориентировочную итоговую стоимость.",
  },
  {
    title: "Свяжитесь с менеджером",
    text: "Когда нашли подходящий вариант, позвоните или напишите в MAX и сообщите, какой автомобиль рассматриваете.",
  },
];

const buySteps = [
  {
    title: "Выбор автомобиля",
    text: "Вы находите автомобиль на сайте или сообщаете менеджеру параметры для подбора.",
  },
  {
    title: "Определение бюджета",
    text: "Определяетесь с допустимой стоимостью автомобиля и ориентируетесь на расчёт по выбранному варианту.",
  },
  {
    title: "Покупка и доставка в Россию",
    text: "Для Японии это участие в аукционе. Для Китая — оформление покупки выбранного автомобиля. После покупки автомобиль направляется в Россию.",
  },
  {
    title: "Таможенное оформление",
    text: "Автомобиль проходит необходимые таможенные процедуры.",
  },
  {
    title: "Лаборатория",
    text: "После таможенного оформления автомобиль проходит необходимые процедуры лаборатории.",
  },
  {
    title: "Доставка в город назначения",
    text: "При необходимости организуется дальнейшая доставка автомобиля в выбранный город.",
  },
  {
    title: "Получение автомобиля",
    text: "Финальный этап — передача автомобиля клиенту.",
  },
];

const beforePurchase = [
  {
    title: "Проверьте конкретный лот",
    text: "Сравнивайте не только модель и год, но и пробег, состояние, оценку, фотографии и доступные документы конкретного автомобиля.",
  },
  {
    title: "Считайте стоимость как ориентир",
    text: "Калькулятор помогает понять порядок итоговой суммы, но актуальные расходы по конкретному автомобилю нужно подтвердить перед покупкой.",
  },
  {
    title: "Уточните маршрут доставки",
    text: "Страна покупки, место автомобиля и город назначения влияют на маршрут, сроки и расходы после покупки.",
  },
];

function StepList({ items }: { items: typeof chooseSteps }) {
  return (
    <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
      {items.map((item, index) => (
        <article key={item.title} className="grid gap-4 p-5 sm:grid-cols-[52px_1fr] sm:p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#07152f] text-sm font-black text-white">
            {index + 1}
          </div>
          <div>
            <h3 className="text-lg font-black tracking-[-0.025em] text-[#07152f]">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function HowToBuyPage() {
  return (
    <PublicInfoShell
      currentPath="/how-to-buy"
      eyebrow="Как купить"
      title="Как купить автомобиль из Японии или Китая"
      intro="Ниже собрали весь путь: от самостоятельного поиска и расчёта до покупки, оформления и получения автомобиля."
    >
      <section>
        <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff2d3d]">Самостоятельный подбор</div>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Как найти подходящий автомобиль</h2>
        <StepList items={chooseSteps} />
      </section>

      <section>
        <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff2d3d]">После выбора</div>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Как проходит покупка</h2>
        <StepList items={buySteps} />
      </section>

      <section>
        <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff2d3d]">Перед решением</div>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Что важно подтвердить до покупки</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {beforePurchase.map((item) => (
            <article key={item.title} className="rounded-[1.5rem] bg-white p-5 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff2d3d] text-sm font-black text-white">✓</div>
              <h3 className="mt-4 text-lg font-black text-[#07152f]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href="/japan" className="rounded-[1.6rem] bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 transition hover:-translate-y-0.5">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff2d3d]">Япония</div>
          <h2 className="mt-2 text-2xl font-black">Авто с японских аукционов</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Перейти к поиску автомобилей, статистике продаж и японскому калькулятору.</p>
          <div className="mt-5 text-sm font-black text-[#07152f]">Перейти →</div>
        </Link>
        <Link href="/china" className="rounded-[1.6rem] bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 transition hover:-translate-y-0.5">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff2d3d]">Китай</div>
          <h2 className="mt-2 text-2xl font-black">Автомобили из Китая</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">Перейти к актуальным предложениям и калькулятору стоимости автомобиля из Китая.</p>
          <div className="mt-5 text-sm font-black text-[#07152f]">Перейти →</div>
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["/about", "О MosaicAuto", "Какие данные и инструменты доступны на сайте."],
          ["/delivery", "Доставка", "Этапы после покупки и что влияет на маршрут."],
          ["/contacts", "Контакты", "Телефон менеджера и MAX."],
        ].map(([href, title, text]) => (
          <Link key={href} href={href} className="rounded-2xl bg-[#f7f9fc] p-5 ring-1 ring-slate-200 transition hover:bg-white hover:shadow-lg">
            <div className="font-black text-[#07152f]">{title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-500">{text}</div>
            <div className="mt-4 text-sm font-black text-[#ff2d3d]">Подробнее →</div>
          </Link>
        ))}
      </section>
    </PublicInfoShell>
  );
}
