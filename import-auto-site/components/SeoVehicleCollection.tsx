import Link from "next/link";

type ModelLink = {
  name: string;
  count: number;
  href: string;
};

type Vehicle = {
  id?: string;
  lot?: string;
  brand?: string;
  model?: string;
  year?: string | number | null;
  mileage?: string | number | null;
  previewImage?: string;
  image?: string;
  finishPrice?: string | number | null;
  averagePrice?: string | number | null;
  price?: string | number | null;
};

function number(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatNumber(value: unknown) {
  const n = number(value);
  return n ? new Intl.NumberFormat("ru-RU").format(Math.round(n)) : "—";
}

export default function SeoVehicleCollection({
  market,
  title,
  description,
  total,
  catalogHref,
  calculatorHref,
  models = [],
  cars = [],
}: {
  market: "japan" | "china";
  title: string;
  description: string;
  total: number;
  catalogHref: string;
  calculatorHref: string;
  models?: ModelLink[];
  cars?: Vehicle[];
}) {
  const isJapan = market === "japan";
  const currency = isJapan ? "¥" : "¥";

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <section className="mx-auto max-w-[1500px] px-4 py-8 lg:px-6 lg:py-12">
        <div className="rounded-[2rem] bg-[#07152f] p-6 text-white shadow-xl shadow-slate-300/60 sm:p-8 lg:p-10">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff5662]">
            {isJapan ? "Автомобили из Японии" : "Автомобили из Китая"}
          </div>
          <h1 className="mt-3 max-w-5xl text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/70 sm:text-base">
            {description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={catalogHref}
              className="rounded-xl bg-[#ff2d3d] px-5 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[#07152f]"
            >
              Смотреть {new Intl.NumberFormat("ru-RU").format(total)} авто
            </Link>
            <Link
              href={calculatorHref}
              className="rounded-xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white hover:text-[#07152f]"
            >
              Рассчитать стоимость
            </Link>
          </div>
        </div>

        {models.length ? (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 sm:p-8">
            <h2 className="text-2xl font-black tracking-[-0.035em]">Модели</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {models.map((model) => (
                <Link
                  key={model.href}
                  href={model.href}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black ring-1 ring-slate-100 transition hover:bg-[#07152f] hover:text-white"
                >
                  <span>{model.name}</span>
                  <span className="text-slate-400">{new Intl.NumberFormat("ru-RU").format(model.count)}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-[#ff2d3d]">Актуальные предложения</div>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Автомобили</h2>
            </div>
            <Link href={catalogHref} className="text-sm font-black text-[#2454d8] hover:text-[#ff2d3d]">
              Весь каталог →
            </Link>
          </div>

          {cars.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cars.map((car) => {
                const id = String(car.id || car.lot || "").trim();
                const href = isJapan ? `/catalog/${encodeURIComponent(id)}` : `/china/${encodeURIComponent(id)}`;
                const image = String(car.previewImage || car.image || "").trim();
                const price = car.finishPrice || car.price || car.averagePrice;

                return (
                  <Link key={`${href}-${car.lot || ""}`} href={href} className="overflow-hidden rounded-[1.5rem] bg-white shadow-lg shadow-slate-200/60 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-xl">
                    <div className="flex h-48 items-center justify-center bg-slate-100">
                      {image ? (
                        <img src={image} alt={[car.brand, car.model, car.year].filter(Boolean).join(" ")} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-sm font-bold text-slate-400">Фото отсутствует</span>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="text-lg font-black tracking-[-0.02em]">
                        {[car.brand, car.model].filter(Boolean).join(" ") || "Автомобиль"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-slate-500">
                        {car.year ? <span>{car.year} г.</span> : null}
                        {number(car.mileage) ? <span>{formatNumber(car.mileage)} км</span> : null}
                        {car.lot ? <span>Лот {car.lot}</span> : null}
                      </div>
                      {number(price) ? (
                        <div className="mt-4 text-xl font-black text-emerald-700">
                          {formatNumber(price)} {currency}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-white p-6 text-sm font-bold text-slate-500 ring-1 ring-slate-200">
              В текущей выборке нет автомобилей. Откройте основной каталог и измените параметры поиска.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
