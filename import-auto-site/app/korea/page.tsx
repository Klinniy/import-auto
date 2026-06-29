import Link from "next/link";

export default function KoreaPage() {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <section className="mx-auto max-w-[1200px] px-4 py-10 lg:px-6">
        <Link
          href="/"
          className="inline-flex rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-[#07152f] hover:text-white"
        >
          ← На главную
        </Link>

        <div className="mt-8 rounded-[2rem] bg-gradient-to-br from-purple-700 to-slate-950 p-8 text-white shadow-2xl shadow-slate-300/70 md:p-12">
          <div className="text-sm font-black uppercase tracking-[0.24em] text-purple-100">
            korea
          </div>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.07em]">
            Автомобили из Кореи
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            Раздел заведён как отдельное направление. Позже здесь появятся
            время Seoul, курс KRW, каталог/источники корейских авто и отдельная
            логика расчёта.
          </p>

          <div className="mt-8 inline-flex rounded-2xl bg-white/10 px-6 py-4 font-black text-white ring-1 ring-white/15">
            Раздел в разработке
          </div>
        </div>
      </section>
    </main>
  );
}
