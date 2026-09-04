import Link from "next/link";
import type { ReactNode } from "react";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { MANAGER_PHONE, MANAGER_PHONE_E164, MAX_URL } from "@/lib/seo";

export function InfoCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.6rem] bg-white p-6 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200 sm:p-7">
      <h2 className="text-2xl font-black tracking-[-0.04em] text-[#07152f]">{title}</h2>
      <div className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{children}</div>
    </section>
  );
}

export function ContactPanel({
  title = "Связаться с менеджером",
  text = "Позвоните или напишите в MAX — можно сразу прислать ссылку на автомобиль или описать, что нужно подобрать.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="rounded-[1.8rem] bg-[#07152f] p-6 text-white shadow-xl shadow-slate-300/60 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
      <div className="max-w-2xl">
        <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff5662]">MosaicAuto</div>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] sm:text-3xl">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/65 sm:text-base">{text}</p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:min-w-[470px]">
        <a
          href={`tel:${MANAGER_PHONE_E164}`}
          className="rounded-xl bg-[#ff2d3d] px-5 py-4 text-center text-sm font-black text-white transition hover:bg-white hover:text-[#07152f]"
        >
          Позвонить · {MANAGER_PHONE}
        </a>
        <a
          href={MAX_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-white/10 px-5 py-4 text-center text-sm font-black text-white ring-1 ring-white/15 transition hover:bg-white hover:text-[#07152f]"
        >
          Написать в MAX
        </a>
      </div>
    </section>
  );
}

export default function PublicInfoShell({
  eyebrow,
  title,
  intro,
  children,
  contact = true,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  contact?: boolean;
}) {
  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <PublicSiteHeader />

      <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-6 lg:py-12">
        <section className="rounded-[2rem] bg-[#07152f] p-6 text-white shadow-xl shadow-slate-300/60 sm:p-8 lg:p-10">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-[#ff5662]">{eyebrow}</div>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/68 sm:text-lg">{intro}</p>
        </section>

        <div className="mt-8 grid gap-6">{children}</div>

        {contact && <div className="mt-8"><ContactPanel /></div>}

        <footer className="mt-10 border-t border-slate-200 py-6 text-sm text-slate-500">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>© MosaicAuto · импорт автомобилей из Японии и Китая</div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-bold">
              <Link href="/privacy" className="hover:text-[#07152f]">Обработка персональных данных</Link>
              <Link href="/" className="hover:text-[#07152f]">На главную</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
