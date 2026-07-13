"use client";

type FactoryDetailTopNavProps = {
  lotHref?: string;
  catalogHref: string;
  offersHref: string;
  statsHref?: string;
};

export default function FactoryDetailTopNav({
  lotHref,
  catalogHref,
  offersHref,
  statsHref,
}: FactoryDetailTopNavProps) {
  function handleBackToLot() {
    if (lotHref) {
      window.location.href = lotHref;
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = catalogHref;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={handleBackToLot}
        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-[#07152f] shadow-sm transition hover:bg-slate-50"
      >
        ← Назад к лоту
      </button>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {statsHref ? (
          <a
            href={statsHref}
            className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-[#07152f] shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Статистика продаж
          </a>
        ) : null}

        <a
          href={offersHref}
          className="inline-flex items-center rounded-full bg-[#ff2d3d] px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-[#d8001f]"
        >
          Предложения аукционов
        </a>

        <a
          href={catalogHref}
          className="inline-flex items-center rounded-full bg-[#07152f] px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-[#0b2248]"
        >
          В каталог
        </a>
      </div>
    </div>
  );
}
