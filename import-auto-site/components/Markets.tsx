import { markets } from "../data/markets";

export default function Markets() {
  return (
    <section id="markets" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Направления импорта
        </h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Разделяем рынки, потому что у каждого направления разные источники
          данных, валюта, логистика, сроки и правила оформления.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        {markets.map((market) => (
          <div
            key={market.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="text-4xl">{market.icon}</div>
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                {market.tag}
              </span>
            </div>

            <h3 className="mt-5 text-xl font-bold">{market.title}</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {market.subtitle}
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {market.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}