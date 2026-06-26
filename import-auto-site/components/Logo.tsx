export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="24" fill="#0B1630"/>
        <path d="M50 9 81 27v18L50 27 19 45V27L50 9Z" fill="#F8FAFC"/>
        <path d="M82 33v33L64 77V44l18-11Z" fill="#EF3B3B"/>
        <path d="M50 74 19 56V38l31 18 31-18v18L50 74Z" fill="#CBD5E1"/>
        <path d="M18 33v33l18 11V44L18 33Z" fill="#64748B"/>
        <path d="M34 53c5-9 13-13 24-12 9 1 16 5 20 13-9-3-17-4-26-4-7 0-13 1-18 3Z" fill="#F8FAFC"/>
        <path d="M30 57h42v8H30z" fill="#F8FAFC"/>
        <circle cx="37" cy="68" r="5" fill="#0B1630"/>
        <circle cx="66" cy="68" r="5" fill="#0B1630"/>
      </svg>

      <div>
        <div className="text-xl font-black leading-none tracking-tight text-[#07152f]">
          MOSAIC<span className="text-red-500">AUTO</span>
        </div>
        <div className="mt-1 text-xs font-black tracking-[0.24em] text-slate-400">
          ИМПОРТ АВТОМОБИЛЕЙ
        </div>
      </div>
    </div>
  );
}
