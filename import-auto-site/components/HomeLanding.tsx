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
    number: "01",
    tag: "Подбор",
    title: "Под ваш бюджет и задачи",
    text: "Подбираем автомобиль не только по марке и году — учитываем бюджет, сценарий использования и итоговую стоимость покупки.",
  },
  {
    number: "02",
    tag: "Прозрачность",
    title: "Безопасно и понятно",
    text: "До покупки вы видите данные лота, расчёт расходов и ключевые параметры автомобиля — без скрытых этапов и неожиданных сумм.",
  },
  {
    number: "03",
    tag: "Цена",
    title: "Рыночная цена до ставки",
    text: "Статистика продаж помогает понять реальную стоимость похожих автомобилей и принимать решение до участия в торгах.",
  },
  {
    number: "04",
    tag: "Проверка",
    title: "Состояние авто до покупки",
    text: "Фото, пробег, оценка, комплектация и данные аукциона доступны ещё до того, как вы принимаете решение о покупке.",
  },
  {
    number: "05",
    tag: "Расчёт",
    title: "Стоимость в вашем городе заранее",
    text: "Калькулятор показывает ориентир полной стоимости с покупкой, доставкой, таможенными платежами и оформлением.",
  },
  {
    number: "06",
    tag: "Аукцион",
    title: "Аукционный лист и данные лота",
    text: "Работаем с исходной информацией аукциона, чтобы решение принималось по фактам, а не только по фотографиям автомобиля.",
  },
  {
    number: "07",
    tag: "Сроки",
    title: "Понятные этапы и сроки",
    text: "Покупка проходит последовательно: подбор, проверка, расчёт, покупка, доставка и оформление — вы понимаете, что происходит на каждом этапе.",
  },
  {
    number: "08",
    tag: "Доставка",
    title: "Надёжная доставка",
    text: "Сопровождаем автомобиль после покупки до получения и контролируем движение по основным этапам логистики и оформления.",
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
    <section className="relative mt-8 overflow-hidden rounded-[2rem] bg-[#07152f] text-white shadow-2xl shadow-slate-300/70 ring-1 ring-slate-200">
      <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#ff2d3d]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.45fr_0.8fr] lg:items-end lg:px-10 lg:py-12">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.34em] text-[#ff5662]">
            Почему MosaicAuto
          </div>
          <h2 className="mt-4 max-w-4xl text-4xl font-black leading-[0.96] tracking-[-0.06em] sm:text-5xl lg:text-6xl">
            Почему выбирают нас
          </h2>
          <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-white/65 sm:text-lg sm:leading-8">
            Покупка автомобиля из другой страны должна быть понятной ещё до оплаты. Мы собираем данные, расчёты и этапы сделки в одном месте, чтобы решение принималось спокойно и на фактах.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {["до ставки", "до покупки", "до доставки"].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-white/[0.07] px-3 py-4 text-center ring-1 ring-white/10 sm:px-4 sm:py-5"
            >
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40 sm:text-xs">
                понятно
              </div>
              <div className="mt-1 text-xs font-black leading-4 text-white sm:text-sm">
                {item}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {whyReasons.map((reason, index) => (
          <article
            key={reason.number}
            className={`group min-h-[230px] border-b border-white/10 p-6 transition sm:p-7 lg:min-h-[260px] lg:border-r ${
              index === 0
                ? "bg-[#ff2d3d]"
                : "bg-white/[0.025] hover:bg-white/[0.07]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black ring-1 ${
                  index === 0
                    ? "bg-white text-[#07152f] ring-white"
                    : "bg-white/[0.08] text-white ring-white/10"
                }`}
              >
                {reason.number}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-[0.22em] ${
                  index === 0 ? "text-white/70" : "text-[#ff5662]"
                }`}
              >
                {reason.tag}
              </span>
            </div>

            <h3 className="mt-7 text-xl font-black leading-6 tracking-[-0.035em] sm:text-2xl sm:leading-7">
              {reason.title}
            </h3>
            <p className={`mt-4 text-sm leading-6 ${index === 0 ? "text-white/85" : "text-white/58"}`}>
              {reason.text}
            </p>
          </article>
        ))}
      </div>

      <div className="relative flex flex-col gap-4 border-t border-white/10 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div>
          <div className="text-sm font-black text-white">Выберите рынок и начните с реальных автомобилей</div>
          <div className="mt-1 text-xs font-medium text-white/45">Каталоги, актуальные лоты и расчёт стоимости доступны сразу.</div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Link
            href="/japan"
            className="rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-[#07152f] transition hover:bg-[#ff2d3d] hover:text-white sm:px-5 sm:text-sm"
          >
            Авто из Японии
          </Link>
          <Link
            href="/china"
            className="rounded-xl bg-white/10 px-4 py-3 text-center text-xs font-black text-white ring-1 ring-white/15 transition hover:bg-white hover:text-[#07152f] sm:px-5 sm:text-sm"
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
