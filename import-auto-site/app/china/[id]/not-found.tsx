import Link from "next/link";

export default function ChinaLotNotFound() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] p-6 text-[#07152f] sm:p-8">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-center shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff2d3d]">MosaicAuto</div>
        <h1 className="mt-3 text-3xl font-black">Автомобиль не найден</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          Возможно, предложение уже удалено из источника или ссылка устарела. Вернитесь в каталог и выберите актуальный автомобиль.
        </p>
        <Link
          href="/china"
          className="mt-6 inline-flex rounded-xl bg-[#07152f] px-6 py-3 font-black text-white transition hover:bg-[#ff2d3d]"
        >
          В каталог Китая
        </Link>
      </div>
    </main>
  );
}
