import Link from "next/link";

const nav = [
  ["Каталог", "/catalog"],
  ["Аукционы", "/catalog"],
  ["Калькулятор", "/#calc"],
  ["Услуги", "/#services"],
  ["Как купить", "/#about"],
  ["Контакты", "/#contacts"],
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mosaic-shell flex h-[76px] items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07152f] shadow-lg">
            <div className="absolute h-7 w-7 rotate-45 rounded-md border-[5px] border-white" />
            <div className="absolute bottom-2 right-2 h-4 w-4 rounded-sm bg-[#ff2d3d]" />
            <div className="absolute h-2 w-6 rounded-full bg-white" />
          </div>

          <div>
            <div className="text-xl font-black leading-none tracking-[-0.04em] text-[#07152f]">
              MOSAIC<span className="text-[#ff2d3d]">AUTO</span>
            </div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
              импорт автомобилей
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-9 text-[15px] font-bold text-[#07152f] lg:flex">
          {nav.map(([title, href]) => (
            <Link key={title} href={href} className="transition hover:text-[#ff2d3d]">
              {title}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-[#07152f] shadow-sm transition hover:border-red-200 hover:text-[#ff2d3d]">
            ♡ Избранное
          </button>
          <button className="rounded-2xl bg-[#07152f] px-7 py-3 font-bold text-white shadow-lg shadow-slate-300 transition hover:bg-[#ff2d3d]">
            Войти в кабинет
          </button>
        </div>

        <button className="rounded-2xl bg-[#07152f] px-5 py-3 text-sm font-bold text-white md:hidden">
          Меню
        </button>
      </div>
    </header>
  );
}
