import Image from "next/image";
import Link from "next/link";

const markets = [
  {
    title: "Япония",
    badge: "JP",
    image: "/mosaic/market-japan.png",
    color: "from-[#082045]/95 to-[#173d6b]/78",
    status: "",
    items: ["Аукционы Японии", "Статистика продаж", "Аукционные листы", "Честные оценки"],
    cta: "Перейти в каталог",
  },
  {
    title: "Корея",
    badge: "KR",
    image: "/mosaic/market-korea.png",
    color: "from-[#14396c]/92 to-[#2b68a5]/72",
    status: "В разработке",
    items: ["Дилерские авто", "Страховые лоты", "Прямые поставки", "Проверка истории"],
    cta: "Скоро в работе",
  },
  {
    title: "Китай",
    badge: "CN",
    image: "/mosaic/market-china.png",
    color: "from-[#008b88]/88 to-[#0f766e]/72",
    status: "В разработке",
    items: ["Новые авто", "Электромобили", "Под заказ", "Прямые поставки"],
    cta: "Скоро в работе",
  },
];

export default function Markets() {
  return (
    <section id="markets" className="py-20">
      <div className="mosaic-shell">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black tracking-[-0.04em] text-[#07152f] md:text-5xl">
              Направления импорта
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-slate-600">
              Для каждого рынка — своя логика проверки, расчёта, логистики и оформления.
            </p>
          </div>
          <Link href="#contacts" className="hidden font-black text-blue-700 md:block">
            Все направления →
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {markets.map((market) => (
            <article
              key={market.title}
              className="group relative min-h-[440px] overflow-hidden rounded-[2rem] bg-[#07152f] shadow-2xl shadow-slate-300/50"
            >
              <Image
                src={market.image}
                alt={market.title}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${market.color}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07152f]/90 via-transparent to-transparent" />

              <div className="relative z-10 flex h-full min-h-[440px] flex-col justify-between p-8 text-white">
                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-[#07152f]">
                      {market.badge}
                    </div>
                    <h3 className="text-4xl font-black tracking-[-0.04em]">{market.title}</h3>
                    {market.status && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700">
                        {market.status}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 text-base font-bold">
                    {market.items.map((item) => (
                      <li key={item}>✓ {item}</li>
                    ))}
                  </ul>
                </div>

                <button className="w-fit rounded-2xl bg-white px-7 py-4 font-black text-[#07152f] shadow-xl transition hover:bg-[#ff2d3d] hover:text-white">
                  {market.cta} →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
