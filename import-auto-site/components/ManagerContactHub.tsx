"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const PHONE_DISPLAY = "+7 916 712-73-06";
const PHONE_HREF = "tel:+79167127306";
const MAX_HREF = "https://max.ru/u/f9LHodD0cOI_qf3LXsnjJrhrQP1KGWSV8M01vyrAEtwN22MUaYWCjDGCd6U";

function PhoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7.1 3.5 9.3 7a1.6 1.6 0 0 1-.2 1.9l-1.4 1.4a14.6 14.6 0 0 0 6 6l1.4-1.4a1.6 1.6 0 0 1 1.9-.2l3.5 2.2a1.6 1.6 0 0 1 .7 1.8l-.6 2.1a1.6 1.6 0 0 1-1.5 1.1C9.7 21.9 2.1 14.3 2.1 4.9A1.6 1.6 0 0 1 3.2 3.4l2.1-.6a1.6 1.6 0 0 1 1.8.7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MaxIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.2 5.2A3.2 3.2 0 0 1 7.4 2h9.2a3.2 3.2 0 0 1 3.2 3.2v8.2a3.2 3.2 0 0 1-3.2 3.2h-5.1l-4.8 3.6.8-3.6h-.1a3.2 3.2 0 0 1-3.2-3.2V5.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 8.2h8M8 11.5h5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function patchPurchaseButtons() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));

  for (const button of buttons) {
    const text = (button.textContent || "").replace(/\s+/g, " ").trim();
    if (!text.includes("Обсудить покупку")) continue;

    button.dataset.mosaicautoContactTrigger = "1";
    button.setAttribute("aria-label", "Обсудить детали с менеджером");

    const content = button.querySelector<HTMLElement>(":scope > span");
    if (content && content.firstChild?.nodeType === Node.TEXT_NODE) {
      content.firstChild.textContent = "Обсудить детали ";
    } else {
      button.textContent = "Обсудить детали →";
    }
  }
}

export default function ManagerContactHub() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isPrivate = pathname.startsWith("/crm") || pathname.startsWith("/debug");
  const isLot = pathname.startsWith("/catalog/") || /^\/china\/[^/]+/.test(pathname);

  useEffect(() => {
    if (isPrivate) return;

    patchPurchaseButtons();

    const observer = new MutationObserver(() => patchPurchaseButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    function interceptPurchaseCta(event: MouseEvent) {
      const element = event.target as HTMLElement | null;
      const trigger = element?.closest<HTMLButtonElement>('button[data-mosaicauto-contact-trigger="1"]');
      if (!trigger) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setOpen(true);
    }

    document.addEventListener("click", interceptPurchaseCta, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("click", interceptPurchaseCta, true);
    };
  }, [isPrivate, pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (isPrivate) return null;

  return (
    <>
      <div
        className={`fixed right-3 z-[65] flex items-center gap-2 sm:right-5 ${
          isLot ? "bottom-24 sm:bottom-5" : "bottom-4 sm:bottom-5"
        }`}
        aria-label="Связаться с менеджером"
      >
        <a
          href={PHONE_HREF}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#07152f] text-white shadow-xl shadow-slate-900/20 ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:bg-[#ff2d3d] sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3"
          aria-label={`Позвонить менеджеру ${PHONE_DISPLAY}`}
        >
          <PhoneIcon />
          <span className="hidden text-sm font-black sm:inline">{PHONE_DISPLAY}</span>
        </a>

        <a
          href={MAX_HREF}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#07152f] shadow-xl shadow-slate-900/15 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:bg-[#07152f] hover:text-white sm:h-auto sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3"
          aria-label="Написать менеджеру в MAX"
        >
          <MaxIcon />
          <span className="hidden text-sm font-black sm:inline">Написать в MAX</span>
        </a>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-[#020b1f]/70 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Связаться с менеджером"
            className="w-full rounded-t-[1.75rem] bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-[1.75rem] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-[#ff2d3d]">
                  MosaicAuto
                </div>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#07152f]">
                  Обсудить детали
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Выберите удобный способ связи с менеджером.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 transition hover:bg-slate-200"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href={PHONE_HREF}
                className="group rounded-2xl bg-[#07152f] p-5 text-white transition hover:-translate-y-0.5 hover:bg-[#ff2d3d]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <PhoneIcon className="h-6 w-6" />
                </span>
                <div className="mt-4 text-lg font-black">Позвонить</div>
                <div className="mt-1 text-sm font-bold text-white/70">{PHONE_DISPLAY}</div>
                <div className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-white/55 group-hover:text-white/80">
                  Связаться сейчас →
                </div>
              </a>

              <a
                href={MAX_HREF}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl bg-[#f4f7fb] p-5 text-[#07152f] ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-[#07152f]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                  <MaxIcon className="h-6 w-6" />
                </span>
                <div className="mt-4 text-lg font-black">Написать в MAX</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">Откроется чат с менеджером</div>
                <div className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-[#ff2d3d]">
                  Открыть MAX →
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
