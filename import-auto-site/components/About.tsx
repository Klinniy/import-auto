import Image from "next/image";

const facts = [
  ["250 000+", "автомобилей в базе"],
  ["50+", "аукционов и дилеров"],
  ["10+ лет", "опыта работы"],
  ["3 000+", "довольных клиентов"],
  ["от 7 дней", "срок доставки"],
];

export default function About() {
  return (
    <section id="about" className="py-12">
      <div className="mosaic-shell">
        <div className="grid overflow-hidden rounded-[2.5rem] bg-[#07152f] shadow-2xl shadow-slate-300/60 lg:grid-cols-2">
          <div className="relative min-h-[420px]">
            <Image
              src="/mosaic/about-bg.png"
              alt="Проверка автомобиля"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="p-8 text-white md:p-12">
            <div className="mb-4 text-sm font-black uppercase tracking-[0.24em] text-red-300">
              Почему MosaicAuto
            </div>
            <h2 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">
              Проверяем автомобиль до покупки
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/75">
              Мы не просто показываем лоты. Проверяем историю, состояние, документы,
              аукционные листы и считаем итоговую стоимость до сделки.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {["Прямой импорт", "Аукционные листы", "Фото и статистика", "Доставка и таможня"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 p-5 font-bold backdrop-blur">
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mosaic-card mt-8 grid gap-4 rounded-[2rem] p-6 md:grid-cols-5">
          {facts.map(([num, text]) => (
            <div key={num} className="border-slate-200 p-4 md:border-r last:border-r-0">
              <div className="text-3xl font-black text-[#07152f]">{num}</div>
              <div className="mt-1 text-sm font-semibold text-slate-500">{text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
