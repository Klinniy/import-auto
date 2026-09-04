import Link from "next/link";

const NAV_ITEMS = [
  { href: "/about", label: "О компании" },
  { href: "/how-to-buy", label: "Как купить" },
  { href: "/delivery", label: "Доставка" },
  { href: "/contacts", label: "Контакты" },
];

export default function PublicSiteHeader({ currentPath = "" }: { currentPath?: string }) {
  return (
    <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
      <div className="mx-auto flex min-h-[64px] max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="MosaicAuto — на главную">
          <img
            src="/brand/mosaicauto-logo.svg"
            alt="MosaicAuto"
            className="h-11 w-11 shrink-0 object-contain"
          />
          <span className="text-lg font-black tracking-[-0.045em] text-[#07152f]">
            Mosaic<span className="text-[#ff2d3d]">Auto</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2" aria-label="Информация о покупке">
          {NAV_ITEMS.map((item) => {
            const active = currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-xl px-3.5 py-2.5 text-xs font-black transition sm:text-sm ${
                  active
                    ? "bg-[#07152f] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-[#07152f] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
