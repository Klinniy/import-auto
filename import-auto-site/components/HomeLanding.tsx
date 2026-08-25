import Link from "next/link";

const countries = [
  {
    title: "Япония",
    code: "JAPAN",
    href: "/japan",
    status: "",
    description:
      "Японские аукционы, актуальные лоты, фото, характеристики и расчёт стоимости автомобиля до покупки.",
    accent: "from-blue-600 to-slate-950",
    flag: "jp",
    points: ["Аукционы", "Лоты", "Расчёт", "Подбор"],
    disabled: false,
  },
  {
    title: "Китай",
    code: "CHINA",
    href: "/china",
    status: "",
    description:
      "Автомобили из Китая: новые авто, электромобили, цены в юанях, фото и карточки лотов.",
    accent: "from-red-600 to-slate-950",
    flag: "cn",
    points: ["Каталог", "Электро", "Юани", "Расчёт"],
    disabled: false,
  },
  {
    title: "Корея",
    code: "KOREA",
    href: "/korea",
    status: "в подготовке",
    description:
      "Раздел под автомобили из Кореи готовится. Скоро добавим каталог, расчёт и условия доставки.",
    accent: "from-purple-700 to-slate-950",
    flag: "kr",
    points: ["Скоро", "Каталог", "Расчёт", "Доставка"],
    disabled: false,
  },
  {
    title: "Россия",
    code: "RUSSIA",
    href: "#",
    status: "скоро появится",
    description:
      "Готовим раздел с автомобилями в России: наличие, быстрый подбор, проверка и помощь с покупкой.",
    accent: "from-slate-700 to-slate-950",
    flag: "ru",
    points: ["Скоро", "Наличие", "Проверка", "Подбор"],
    disabled: true,
  },
];

const whyReasons = [
  {
    title: "Подбор под бюджет и задачи",
    text: "Ищем автомобиль под ваши требования и заранее учитываем итоговую стоимость покупки.",
  },
  {
    title: "Реальная цена до ставки",
    text: "Статистика продаж показывает рынок похожих автомобилей до участия в торгах.",
  },
  {
    title: "Проверка до покупки",
    text: "Фото, пробег, оценка, характеристики и аукционный лист доступны до решения о покупке.",
  },
  {
    title: "Стоимость в вашем городе",
    text: "Заранее считаем покупку, доставку, таможенные платежи и основные расходы на оформление.",
  },
  {
    title: "Прозрачный процесс и сроки",
    text: "Понятные этапы сделки: от подбора и покупки до доставки и получения автомобиля.",
  },
  {
    title: "Надёжная доставка",
    text: "Сопровождаем автомобиль после покупки и контролируем основные этапы логистики.",
  },
];

function Flag({ type }: { type: string }) {
  if (type === "jp") {
    return (
      <div className="flex h-16 w-24 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-white/40">
        <div className="h-8 w-8 rounded-full bg-[#bc002d]" />
      </div>
    );
  }

  if (type === "cn") {
    return (
      <div className="relative h-16 w-24 overflow-hidden rounded-2xl bg-[#de2910] shadow-lg ring-1 ring-white/40">
        <div className="absolute left-4 top-3 text-2xl leading-none text-[#ffde00]">★</div>
        <div className="absolute left-11 top-3 text-[10px] leading-none text-[#ffde00]">★</div>
        <div className="absolute left-13 top-6 text-[10px] leading-none text-[#ffde00]">★</div>
        <div className="absolute left-10 top-9 text-[10px] leading-none text-[#ffde00]">★</div>
      </div>
    );
  }

  if (type === "ru") {
    return (
      <div className="h-16 w-24 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-white/40">
        <div className="h-1/3 bg-white" />
        <div className="h-1/3 bg-[#0039a6]" />
        <div className="h-1/3 bg-[#d52b1e]" />
      </div>
    );
  }

  return (
    <div className="relative flex h-16 w-24 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-white/40">
      <div className="absolute left-3 top-3 h-1.5 w-5 rotate-[-28deg] rounded bg-black" />
      <div className="absolute left-3 top-6 h-1.5 w-5 rotate-[-28deg] rounded bg-black" />
      <div className="absolute right-3 bottom-3 h-1.5 w-5 rotate-[-28deg] rounded bg-black" />
      <div className="absolute right-3 bottom-6 h-1.5 w-5 rotate-[-28deg] rounded bg-black" />
      <div className="relative h-9 w-9 overflow-hidden rounded-full">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-[#cd2e3a]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#0047a0]" />
      </div>
    </div>
  );
}

function CountryCard({ country }: { country: (typeof countries)[number] }) {
  return (
    <article
      className={`group flex min-h-[390px] flex-col overflow-hidden rounded-[2rem] bg-gradient-to-br ${country.accent} p-6 text-white shadow-xl shadow-slate-300/70 ring-1 ring-slate-200 transition ${
        country.disabled ? "cursor-default opacity-95" : "hover:-translate-y-1 hover:shadow-2xl"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <Flag type={country.flag} />
        {country.status ? (
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-black uppercase text-[#07152f]">
            {country.status}
          </div>
        ) : null}
      </div>

      <div className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-white/55">
        {country.code}
      </div>

      <h2 className="mt-3 text-5xl font-black tracking-[-0.07em]">
        {country.title}
      </h2>

      <p className="mt-5 min-h-[112px] text-base leading-7 text-white/72">
        {country.description}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {country.points.map((point) => (
          <span
            key={point}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/80 ring-1 ring-white/10"
          >
            {point}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <div className="inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#07152f] transition group-hover:bg-[#ff2d3d] group-hover:text-white">
          {country.disabled ? "Скоро появится" : "Смотреть автомобили →"}
        </div>
      </div>
    </article>
  );
}

function WhyUsSection() {
  return (
    <section className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/80 ring-1 ring-slate-200">
      <div className="grid gap-6 border-b border-slate-100 px-6 py-7 sm:px-8 sm:py-8 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-[#ff2d3d]">
            Почему MosaicAuto
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#07152f] sm:text-4xl">
            Почему выбирают нас
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
            До покупки вы знаете главное: что покупаете, сколько это стоит и как автомобиль попадёт к вам.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {["Безопасно", "Прозрачно", "Надёжно"].map((item) => (
            <span
              key={item}
              className="rounded-full bg-[#07152f] px-4 py-2 text-xs font-black text-white"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 lg:gap-4 lg:p-8">
        {whyReasons.map((reason) => (
          <article
            key={reason.title}
            className="flex gap-4 rounded-2xl bg-[#f6f8fb] p-5 ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
          >
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ff2d3d] text-sm font-black text-white shadow-sm">
              ✓
            </div>
            <div>
              <h3 className="text-base font-black leading-5 tracking-[-0.02em] text-[#07152f] sm:text-lg">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                {reason.text}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 bg-[#f8fafc] px-6 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="text-sm font-bold text-slate-600">
          Начните с реальных автомобилей и расчёта стоимости.
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Link
            href="/japan"
            className="rounded-xl bg-[#07152f] px-4 py-3 text-center text-xs font-black text-white transition hover:bg-[#ff2d3d] sm:px-5 sm:text-sm"
          >
            Авто из Японии
          </Link>
          <Link
            href="/china"
            className="rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-[#07152f] ring-1 ring-slate-200 transition hover:bg-[#07152f] hover:text-white sm:px-5 sm:text-sm"
          >
            Авто из Китая
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomeLanding() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="MosaicAuto">
            <img
              src="/brand/mosaicauto-logo.svg"
              alt=""
              className="h-16 w-16 shrink-0 object-contain"
            />

            <span className="leading-none">
              <span className="block text-[22px] font-black tracking-[-0.05em] text-[#020b1f]">
                Mosaic<span className="text-[#ff2d3d]">Auto</span>
              </span>
              <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.34em] text-slate-400">
                импорт автомобилей
              </span>
            </span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:py-10 lg:px-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {countries.map((country) =>
            country.disabled ? (
              <div key={country.title}>
                <CountryCard country={country} />
              </div>
            ) : (
              <Link key={country.title} href={country.href}>
                <CountryCard country={country} />
              </Link>
            )
          )}
        </div>

        <WhyUsSection />
      </section>
    </main>
  );
}
