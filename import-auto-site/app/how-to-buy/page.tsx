import type { Metadata } from "next";
import Link from "next/link";

const PHONE_DISPLAY = "+7 916 712-73-06";
const PHONE_HREF = "tel:+79167127306";
const MAX_HREF = "https://max.ru/u/f9LHodD0cOI_qf3LXsnjJrhrQP1KGWSV8M01vyrAEtwN22MUaYWCjDGCd6U";

export const metadata: Metadata = {
  title: "Как купить автомобиль",
  description: "Как выбрать автомобиль из Японии или Китая, рассчитать стоимость и пройти основные этапы покупки и доставки.",
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
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link href="/" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-[#07152f] hover:text-white">
            ← На главную
          </Link>
          <div className="text-sm font-black text-[#07152f]">Как купить</div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-6 lg:py-12">
        <section className="rounded-[2rem] bg-[#07152f] p-6 text-white shadow-xl shadow-slate-300/60 sm:p-8 lg:p-10">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-[#ff5662]">MosaicAuto</div>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl">
            Как купить автомобиль из Японии или Китая
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/68 sm:text-lg">
            Ниже собрали весь путь: от самостоятельного поиска и расчёта до покупки, оформления и получения автомобиля.
          </p>
        </section>

        <section className="mt-8">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff2d3d]">Самостоятельный подбор</div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Как найти подходящий автомобиль</h2>
          <StepList items={chooseSteps} />
        </section>

        <section className="mt-10">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff2d3d]">После выбора</div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Как проходит покупка</h2>
          <StepList items={buySteps} />
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
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

        <section className="mt-10 mb-12 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff2d3d]">Нужна помощь?</div>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Свяжитесь с менеджером</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Если уже нашли автомобиль или хотите обсудить подбор, можно сразу позвонить или написать в MAX.</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:min-w-[470px]">
            <a href={PHONE_HREF} className="rounded-xl bg-[#ff2d3d] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#07152f]">
              Позвонить · {PHONE_DISPLAY}
            </a>
            <a href={MAX_HREF} target="_blank" rel="noreferrer" className="rounded-xl bg-[#07152f] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-[#ff2d3d]">
              Написать в MAX
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
