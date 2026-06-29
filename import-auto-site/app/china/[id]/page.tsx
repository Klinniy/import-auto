// @ts-nocheck
import Link from "next/link";
import { formatCny, formatNum, getChinaLot } from "@/lib/china/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }> | { id: string };

function row(label: string, value: unknown) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 text-sm">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-black text-[#07152f]">{String(value || "—")}</span>
    </div>
  );
}

export default async function ChinaLotPage({
  params,
}: {
  params: Params;
}) {
  const p = await params;
  const car = await getChinaLot(p.id);

  if (!car) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] p-8 text-[#07152f]">
        <div className="mx-auto max-w-4xl rounded-2xl bg-red-50 p-8 text-center ring-1 ring-red-200">
          <h1 className="text-2xl font-black text-red-700">Лот не найден</h1>
          <Link href="/china" className="mt-5 inline-flex rounded-xl bg-[#07152f] px-5 py-3 font-black text-white">
            Вернуться в каталог Китая
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link href="/china" className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-[#07152f] hover:text-white">
            ← В каталог Китая
          </Link>
          <Link href="/" className="rounded-xl bg-[#07152f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff2d3d]">
            На главную
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1680px] px-4 py-8 lg:px-6">
        <div className="rounded-[1.5rem] bg-white p-6 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.24em] text-[#ff2d3d]">Китай · лот {car.lot}</div>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                {car.brand} {car.model}
              </h1>
              <p className="mt-2 text-lg font-bold text-slate-500">
                {car.year || "—"} · {car.grade || car.color || "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#07152f] p-5 text-white">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-300">цена</div>
              <div className="mt-2 text-4xl font-black">{formatCny(car.priceCny)}</div>
              <div className="mt-2 text-sm font-bold text-slate-300">
                Цена из поля FINISH таблицы china. Расчёт в рублях подключим следующим этапом.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black">Фото автомобиля</h2>
              <span className="text-sm font-bold text-slate-400">{car.images.length} фото</span>
            </div>

            {car.images[0] ? (
              <img src={car.images[0].medium} alt={`${car.brand} ${car.model}`} className="max-h-[520px] w-full rounded-2xl bg-slate-100 object-contain" />
            ) : (
              <div className="flex h-[360px] items-center justify-center rounded-2xl bg-slate-100 font-black text-slate-400">
                нет фото
              </div>
            )}

            {car.images.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {car.images.map((image: any, index: number) => (
                  <a key={image.original} href={image.original} target="_blank" rel="noreferrer">
                    <img src={image.preview} alt={`${car.brand} ${car.model} ${index + 1}`} className="h-20 w-28 rounded-lg object-cover ring-1 ring-slate-200 transition hover:ring-[#ff2d3d]" />
                  </a>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
              <h2 className="text-xl font-black">Характеристики</h2>
              <div className="mt-3">
                {row("Марка", car.brand)}
                {row("Модель", car.model)}
                {row("Год", car.year)}
                {row("Комплектация", car.grade)}
                {row("Цвет", car.color)}
                {row("Кузов", car.body)}
                {row("Объём", formatNum(car.engineVolume, " см³"))}
                {row("Мощность", car.power ? `${car.power} л.с.` : "—")}
                {row("КПП", car.transmission)}
                {row("Привод", car.drive)}
                {row("Пробег", formatNum(car.mileage, " км"))}
              </div>
            </section>

            <section className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/70 ring-1 ring-slate-200">
              <h2 className="text-xl font-black">Данные лота</h2>
              <div className="mt-3">
                {row("ID", car.id)}
                {row("Лот", car.lot)}
                {row("Источник", "Китай")}
                {row("Дата", car.auctionDate === "0000-00-00 00:00:00" ? "—" : car.auctionDate)}
                {row("Цена", formatCny(car.priceCny))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
