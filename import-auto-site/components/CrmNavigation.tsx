"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/crm", label: "Поиск клиентов", exact: true },
  { href: "/crm/clients", label: "Клиенты", exact: false },
  { href: "/crm/leads", label: "Заявки", exact: false },
];

export default function CrmNavigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-[90] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6">
        <Link
          href="/crm"
          className="mr-2 shrink-0 text-sm font-black tracking-[-0.02em] text-[#07152f]"
        >
          MosaicAuto CRM
        </Link>

        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black transition sm:text-sm ${
                active
                  ? "bg-[#07152f] text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-[#07152f]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
