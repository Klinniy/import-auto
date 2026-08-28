import Link from "next/link";

const PHONE_DISPLAY = "+7 916 712-73-06";
const PHONE_HREF = "tel:+79167127306";
const MAX_HREF = "https://max.ru/u/f9LHodD0cOI_qf3LXsnjJrhrQP1KGWSV8M01vyrAEtwN22MUaYWCjDGCd6U";

const countries = [
  {
    title: "Авто из Японии",
    code: "JAPAN",
    href: "/japan",
    description: "Аукционные лоты, статистика продаж и калькулятор стоимости.",
    flag: "jp",
    accent: "bg-blue-600",
  },
  {
    title: "Авто из Китая",
    code: "CHINA",
    href: "/china",
    description: "Актуальные автомобили и расчёт стоимости с доставкой.",
    flag: "cn",
    accent: "bg-[#de2910]",
  },
];

const capabilities = [
  {
    title: "Подбор под бюджет",
    text: "Можно подобрать автомобили под заданную стоимость.",
  },
  {
    title: "Подбор под требования",
    text: "Марка, модель, год, пробег, кузов и другие параметры.",
  },
  {
    title: "Состояние автомобиля",
    text: "Фото, пробег, оценка, характеристики и аукционный лист доступны заранее, когда эти данные есть в источнике.",
  },
  {
    title: "Статистика продаж",
    text: "Можно посмотреть цены продаж автомобилей аналогичного года, состояния и пробега.",
  },
  {
    title: "Расчёт стоимости",
    text: "Калькулятор автоматически рассчитывает ориентировочную итоговую стоимость автомобиля.",
  },
  {
    title: "Понятный путь покупки",
    text: "Основные этапы от выбора автомобиля до получения собраны в отдельной инструкции.",
  },
];

function Flag({ type }: { type: "jp" | "cn" }) {
  if (type === "jp") {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="h-6 w-6 rounded-full bg-[#bc002d]" />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-16 overflow-hidden rounded-xl bg-[#de2910] shadow-sm ring-1 ring-white/20">
      <div className="absolute left-3 top-2 text-lg leading-none text-[#ffde00]">★</div>
      <div className="absolute left-8 top-2 text-[7px] leading-none text-[#ffde00]">★</div>
      <div className="absolute left-9 top-5 text-[7px] leading-none text-[#ffde00]">★</div>
      <div className="absolute left-8 top-8 text-[7px] leading-none text-[#ffde00]">★</div>
    </div>
  );
}

function MarketCard({ country }: { country: (typeof countries)[number] }) {
  return (
    <Link href={country.href} className="h-full">
      <article className="group relative flex h-full min-h-[245px] flex-col overflow-hidden rounded-[1.6rem] bg-[#07152f] p-6 text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-1 hover:shadow-xl">
        <div className={`absolute inset-x-0 top-0 h-1 ${country.accent}`} />
        <div className="flex items-start justify-between gap-3">
          <Flag type={country.flag as "jp" | "cn"} />
          <span className="rounded-full bg-white/8 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
            {country.code}
          </span>
        </div>

        <h2 className="mt-6 text-2xl font-black tracking-[-0.045em] sm:text-3xl">{country.title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/62">{country.description}</p>

        <div className="mt-auto pt-6">
          <span className="inline-flex rounded-xl bg-white px-4 py-3 text-sm font-black text-[#07152f] transition group-hover:bg-[#ff2d3d] group-hover:text-white">
            Открыть →
          </span>
        </div>
      </article>
    </Link>
  );
}

function HeroSection() {
  return (
    <section
      id="cars"
      className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:p-8 lg:p-10"
    >
      <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr_0.85fr] lg:items-stretch">
        <div className="flex flex-col justify-center lg:pr-3">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-[#ff2d3d]">Импорт автомобилей</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#07152f] sm:text-5xl lg:text-[52px]">
            Автомобиль из Японии или Китая — понятно до покупки
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
            Реальные предложения, данные автомобилей, статистика продаж и автоматический расчёт стоимости.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {["Реальные лоты", "Статистика продаж", "Калькулятор"].map((item) => (
              <span
                key={item}
                className="rounded-full bg-[#f4f7fb] px-3 py-2 text-xs font-black text-[#07152f] ring-1 ring-slate-100"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="mt-7">
            <Link
              href="/how-to-buy"
              className="inline-flex rounded-xl bg-[#07152f] px-6 py-4 text-center text-sm font-black text-white transition hover:bg-[#ff2d3d]"
            >
              Как купить →
            </Link>
          </div>
        </div>

        {countries.map((country) => (
          <MarketCard key={country.title} country={country} />
        ))}
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  return (
    <section className="mt-10 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:p-7 lg:p-8">
      <div className="max-w-3xl">
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ff2d3d] sm:text-xs">MosaicAuto</div>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#07152f] sm:text-3xl lg:text-4xl">Что можно сделать на сайте</h2>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map((item) => (
          <article key={item.title} className="flex gap-4 rounded-2xl bg-[#f7f9fc] p-5 ring-1 ring-slate-100">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff2d3d] text-xs font-black text-white">✓</div>
            <div>
              <h3 className="text-base font-black leading-5 tracking-[-0.02em] text-[#07152f] sm:text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-5 text-slate-500">{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowToBuySection() {
  return (
    <section className="mt-10 overflow-hidden rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-10">
      <div className="max-w-3xl">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-[#ff2d3d]">Как купить</div>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#07152f] sm:text-3xl">Впервые покупаете автомобиль из-за границы?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
          Собрали отдельно весь путь: как выбрать автомобиль, использовать статистику, получить расчёт в калькуляторе и что происходит после покупки.
        </p>
      </div>
      <Link
        href="/how-to-buy"
        className="mt-6 inline-flex min-h-13 items-center justify-center rounded-xl bg-[#07152f] px-6 py-4 text-sm font-black text-white transition hover:bg-[#ff2d3d] lg:mt-0 lg:min-w-[210px]"
      >
        Как купить →
      </Link>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="mt-10 mb-16 overflow-hidden rounded-[2rem] bg-[#07152f] px-6 py-7 text-white shadow-xl shadow-slate-300/60 sm:px-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.3em] text-[#ff5662]">Связаться с менеджером</div>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">Остались вопросы?</h2>
        <p className="mt-2 text-sm text-white/60">Позвоните или напишите в MAX.</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:min-w-[470px]">
        <a href={PHONE_HREF} className="rounded-xl bg-[#ff2d3d] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-white hover:text-[#07152f]">
          Позвонить · {PHONE_DISPLAY}
        </a>
        <a href={MAX_HREF} target="_blank" rel="noreferrer" className="rounded-xl bg-white/10 px-5 py-4 text-center text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white hover:text-[#07152f]">
          Написать в MAX
        </a>
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
              <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.28em] text-slate-400 sm:text-[10px]">импорт автомобилей</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/how-to-buy" className="hidden rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-black text-[#07152f] transition hover:bg-[#07152f] hover:text-white sm:inline-flex">
              Как купить
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:py-8 lg:px-6 lg:py-10">
        <HeroSection />
        <CapabilitiesSection />
        <HowToBuySection />
        <ContactSection />
      </div>
    </main>
  );
}
