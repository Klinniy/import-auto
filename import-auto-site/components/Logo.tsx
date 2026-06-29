import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="MosaicAuto">
      <img
        src="/brand/mosaicauto-logo.svg"
        alt=""
        className="h-16 w-16 shrink-0 object-contain"
      />

      <span className="leading-none">
        <span className="block text-[22px] font-black tracking-[-0.05em] text-[#020b1f]">
          Mosaic<span className="text-[#ff2d3d]">Auto</span>
        </span>
        <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.34em] text-slate-400">
          импорт автомобилей
        </span>
      </span>
    </Link>
  );
}
