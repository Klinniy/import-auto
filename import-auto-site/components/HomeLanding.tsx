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

          <Link
            href="/japan"
            className="rounded-xl bg-[#07152f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff2d3d]"
          >
            Смотреть каталог
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-10 lg:px-6">
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
      </section>
    </main>
  );
}
