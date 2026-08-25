import Link from "next/link";

const countries = [
  {
    title: "Япония",
    code: "JAPAN",
    href: "/japan",
    status: "",
    description: "Аукционы, реальные лоты, статистика продаж и расчёт стоимости до покупки.",
    flag: "jp",
    active: true,
    accent: "bg-blue-600",
  },
  {
    title: "Китай",
    code: "CHINA",
    href: "/china",
    status: "",
    description: "Автомобили из Китая, актуальные предложения и расчёт стоимости с доставкой.",
    flag: "cn",
    active: true,
    accent: "bg-[#de2910]",
  },
  {
    title: "Корея",
    code: "KOREA",
    href: "/korea",
    status: "в подготовке",
    description: "Готовим каталог, расчёт стоимости и условия доставки автомобилей из Кореи.",
    flag: "kr",
    active: false,
    accent: "bg-violet-600",
  },
  {
    title: "Россия",
    code: "RUSSIA",
    href: "#",
    status: "скоро",
    description: "Готовим раздел автомобилей в наличии с быстрым подбором и проверкой.",
    flag: "ru",
    active: false,
    accent: "bg-slate-500",
  },
];

const whyReasons = [
  {
    title: "Подбор под бюджет и задачи",
    text: "Ищем автомобиль под ваши требования и заранее учитываем итоговую стоимость.",
  },
  {
    title: "Реальная цена до ставки",
    text: "Статистика продаж помогает понять рынок похожих автомобилей до покупки.",
  },
  {
    title: "Проверка до покупки",
    text: "Фото, пробег, оценка, характеристики и аукционный лист доступны заранее.",
  },
  {
    title: "Стоимость в вашем городе",
    text: "Считаем покупку, доставку, таможенные платежи и основные расходы на оформление.",
  },
  {
    title: "Прозрачный процесс",
    text: "Вы понимаете этапы сделки, сроки и что происходит с автомобилем после покупки.",
  },
  {
    title: "Надёжная доставка",
    text: "Сопровождаем автомобиль и контролируем основные этапы логистики до получения.",
  },
];

const selectionSteps = [
  {
    title: "Выберите рынок",
    text: "Откройте каталог Японии или Китая.",
  },
  {
    title: "Настройте поиск",
    text: "Укажите марку, модель, год и другие параметры.",
  },
  {
    title: "Изучите автомобиль",
    text: "Посмотрите фото, характеристики и данные лота.",
  },
  {
    title: "Сравните цену",
    text: "Проверьте статистику продаж и ориентир по рынку.",
  },
  {
    title: "Посчитайте итог",
    text: "Оцените стоимость с доставкой и оформлением.",
  },
];

const orderSteps = [
  {
    title: "Выбираете автомобиль",
    text: "Находите вариант на сайте или описываете, что нужно подобрать.",
  },
  {
    title: "Мы проверяем",
    text: "Проверяем лот, состояние, документы и возможные риски.",
  },
  {
    title: "Согласовываем бюджет",
    text: "Определяем ориентир итоговой стоимости и цену покупки.",
  },
  {
    title: "Покупаем",
    text: "Участвуем в торгах или оформляем покупку выбранного автомобиля.",
  },
  {
    title: "Доставляем и оформляем",
    text: "Организуем логистику, таможню и необходимые документы.",
  },
  {
    title: "Вы получаете автомобиль",
    text: "Передаём автомобиль в согласованном городе или точке выдачи.",
  },
];

function Flag({ type }: { type: string }) {
  if (type === "jp") {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="h-6 w-6 rounded-full bg-[#bc002d]" />
      </div>
    );
  }

  if (type === "cn") {
    return (
      <div className="relative h-12 w-16 overflow-hidden rounded-xl bg-[#de2910] shadow-sm ring-1 ring-white/20">
        <div className="absolute left-3 top-2 text-lg leading-none text-[#ffde00]">★</div>
        <div className="absolute left-8 top-2 text-[7px] leading-none text-[#ffde00]">★</div>
        <div className="absolute left-9 top-5 text-[7px] leading-none text-[#ffde00]">★</div>
        <div className="absolute left-8 top-8 text-[7px] leading-none text-[#ffde00]">★</div>
      </div>
    );
  }

  if (type === "ru") {
    return (
      <div className="h-12 w-16 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="h-1/3 bg-white" />
        <div className="h-1/3 bg-[#0039a6]" />
        <div className="h-1/3 bg-[#d52b1e]" />
      </div>
    );
  }

  return (
    <div className="relative flex h-12 w-16 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="absolute left-2 top-2 h-1 w-4 rotate-[-28deg] rounded bg-black" />
      <div className="absolute left-2 top-4 h-1 w-4 rotate-[-28deg] rounded bg-black" />
      <div className="absolute right-2 bottom-2 h-1 w-4 rotate-[-28deg] rounded bg-black" />
      <div className="absolute right-2 bottom-4 h-1 w-4 rotate-[-28deg] rounded bg-black" />
      <div className="relative h-7 w-7 overflow-hidden rounded-full">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-[#cd2e3a]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#0047a0]" />
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ff2d3d] sm:text-xs">
        {eyebrow}
      </div>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#07152f] sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
        {text}
      </p>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="grid gap-6 rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:p-10">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-[#ff2d3d]">
          Импорт автомобилей
        </div>
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#07152f] sm:text-5xl lg:text-6xl">
          Автомобиль из Японии или Китая — понятно до покупки
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
          Реальные предложения, проверка автомобиля, ориентир рыночной цены и расчёт стоимости до получения.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            href="#markets"
            className="rounded-xl bg-[#ff2d3d] px-6 py-4 text-center text-sm font-black text-white shadow-lg shadow-red-100 transition hover:bg-[#07152f]"
          >
            Смотреть автомобили
          </a>
          <a
            href="#how-to-choose"
            className="rounded-xl bg-[#07152f] px-6 py-4 text-center text-sm font-black text-white transition hover:bg-slate-800"
          >
            Как подобрать автомобиль
          </a>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {["Реальные данные лотов", "Расчёт до покупки", "Сопровождение сделки"].map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#f6f8fb] p-4 ring-1 ring-slate-100">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-black text-[#ff2d3d] shadow-sm ring-1 ring-slate-200">
              ✓
            </span>
            <span className="text-sm font-black text-[#07152f]">{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CountryCard({ country }: { country: (typeof countries)[number] }) {
  const content = (
    <article
      className={`group relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-[1.6rem] p-5 transition sm:p-6 ${
        country.active
          ? "bg-[#07152f] text-white shadow-xl shadow-slate-300/60 hover:-translate-y-1 hover:shadow-2xl"
          : "bg-white text-[#07152f] shadow-lg shadow-slate-200/60 ring-1 ring-slate-200"
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${country.accent}`} />

      <div className="flex items-start justify-between gap-4">
        <Flag type={country.flag} />
        {country.status ? (
          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
            country.active ? "bg-white/10 text-white/75" : "bg-slate-100 text-slate-500"
          }`}>
            {country.status}
          </span>
        ) : null}
      </div>

      <div className={`mt-6 text-[10px] font-black uppercase tracking-[0.28em] ${country.active ? "text-white/40" : "text-slate-400"}`}>
        {country.code}
      </div>
      <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">{country.title}</h3>
      <p className={`mt-4 text-sm leading-6 ${country.active ? "text-white/62" : "text-slate-500"}`}>
        {country.description}
      </p>

      <div className="mt-auto pt-6">
        <span className={`inline-flex rounded-xl px-4 py-3 text-sm font-black transition ${
          country.active
            ? "bg-white text-[#07152f] group-hover:bg-[#ff2d3d] group-hover:text-white"
            : "bg-slate-100 text-slate-500"
        }`}>
          {country.active ? "Открыть каталог →" : "Скоро появится"}
        </span>
      </div>
    </article>
  );

  if (!country.active || country.href === "#") return content;
  return <Link href={country.href}>{content}</Link>;
}

function MarketsSection() {
  return (
    <section id="markets" className="mt-8 scroll-mt-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Выберите направление"
          title="С какого рынка начать"
          text="Сейчас доступны Япония и Китай. Остальные направления подключаем постепенно."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {countries.map((country) => (
          <CountryCard key={country.title} country={country} />
        ))}
      </div>
    </section>
  );
}

function WhyUsSection() {
  return (
    <section className="mt-10 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:p-7 lg:p-8">
      <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="Почему MosaicAuto"
          title="Почему выбирают нас"
          text="До покупки вы знаете главное: что покупаете, сколько это стоит и как автомобиль попадёт к вам."
        />
        <div className="flex flex-wrap gap-2">
          {["Безопасно", "Прозрачно", "Надёжно"].map((item) => (
            <span key={item} className="rounded-full bg-[#f1f4f8] px-4 py-2 text-xs font-black text-[#07152f]">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {whyReasons.map((reason) => (
          <article key={reason.title} className="flex gap-4 rounded-2xl bg-[#f7f9fc] p-5 ring-1 ring-slate-100">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff2d3d] text-xs font-black text-white">
              ✓
            </div>
            <div>
              <h3 className="text-base font-black leading-5 tracking-[-0.02em] text-[#07152f] sm:text-lg">{reason.title}</h3>
              <p className="mt-2 text-sm leading-5 text-slate-500">{reason.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProcessSection({
  id,
  eyebrow,
  title,
  text,
  steps,
  accent,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  text: string;
  steps: { title: string; text: string }[];
  accent: "navy" | "red";
}) {
  const numberClass = accent === "red" ? "bg-[#ff2d3d]" : "bg-[#07152f]";

  return (
    <section id={id} className="mt-10 scroll-mt-6 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:p-7 lg:p-8">
      <SectionHeading eyebrow={eyebrow} title={title} text={text} />

      <div className="relative mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {steps.map((step, index) => (
          <article key={step.title} className="relative rounded-2xl bg-[#f7f9fc] p-5 ring-1 ring-slate-100">
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white ${numberClass}`}>
                {index + 1}
              </div>
              {index < steps.length - 1 ? <div className="hidden h-px flex-1 bg-slate-200 xl:block" /> : null}
            </div>
            <h3 className="mt-4 text-base font-black leading-5 tracking-[-0.02em] text-[#07152f]">{step.title}</h3>
            <p className="mt-2 text-sm leading-5 text-slate-500">{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="mt-10 overflow-hidden rounded-[2rem] bg-[#07152f] px-6 py-8 text-white shadow-xl shadow-slate-300/60 sm:px-8 sm:py-9 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:px-10">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-[#ff5662]">Следующий шаг</div>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Начните с подходящего автомобиля</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
          Посмотрите реальные предложения, сравните варианты и рассчитайте ориентировочную стоимость до покупки.
        </p>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:min-w-[360px]">
        <Link href="/japan" className="rounded-xl bg-[#ff2d3d] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-white hover:text-[#07152f]">
          Авто из Японии
        </Link>
        <Link href="/china" className="rounded-xl bg-white/10 px-5 py-4 text-center text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white hover:text-[#07152f]">
          Авто из Китая
        </Link>
      </div>
    </section>
  );
}

export default function HomeLanding() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:py-4 lg:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="MosaicAuto">
            <img src="/brand/mosaicauto-logo.svg" alt="MosaicAuto" className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14" />
            <span className="leading-none">
              <span className="block text-xl font-black tracking-[-0.05em] text-[#020b1f] sm:text-[22px]">
                Mosaic<span className="text-[#ff2d3d]">Auto</span>
              </span>
              <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.28em] text-slate-400 sm:text-[10px]">
                импорт автомобилей
              </span>
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:py-8 lg:px-6 lg:py-10">
        <HeroSection />
        <MarketsSection />
        <WhyUsSection />
        <ProcessSection
          id="how-to-choose"
          eyebrow="Самостоятельный поиск"
          title="Как подобрать автомобиль на сайте"
          text="От выбора рынка до понятной ориентировочной стоимости — пять простых шагов."
          steps={selectionSteps}
          accent="navy"
        />
        <ProcessSection
          eyebrow="Покупка с MosaicAuto"
          title="Как заказать автомобиль"
          text="После выбора варианта мы сопровождаем сделку от проверки до получения автомобиля."
          steps={orderSteps}
          accent="red"
        />
        <FinalCtaSection />
      </div>
    </main>
  );
}
