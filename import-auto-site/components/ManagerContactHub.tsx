"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
      <path d="M8 8.2h8M8 11.5h5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function patchPurchaseButton(button: HTMLButtonElement) {
  if (button.dataset.mosaicautoContactPatched === "1") return;

  const text = (button.textContent || "").replace(/\s+/g, " ").trim();
  if (!text.includes("Обсудить покупку") && !text.includes("Обсудить детали")) return;

  // Mark BEFORE changing DOM. This makes our own mutations idempotent and prevents
  // MutationObserver from repeatedly rewriting the same button forever.
  button.dataset.mosaicautoContactPatched = "1";
  button.dataset.mosaicautoContactTrigger = "1";
  button.setAttribute("aria-label", "Обсудить детали с менеджером");

  const content = button.querySelector<HTMLElement>(":scope > span");
  if (content && content.firstChild?.nodeType === Node.TEXT_NODE) {
    if (content.firstChild.textContent !== "Обсудить детали ") {
      content.firstChild.textContent = "Обсудить детали ";
    }
  } else if (text !== "Обсудить детали →") {
    button.textContent = "Обсудить детали →";
  }

  const section = button.closest("section");
  if (!section) return;

  for (const node of Array.from(section.querySelectorAll<HTMLElement>("div,p"))) {
    const value = (node.textContent || "").replace(/\s+/g, " ").trim();

    if (value === "Проверим лот и обсудим покупку") {
      node.textContent = "Свяжитесь с менеджером по этому автомобилю";
    }

    if (value.startsWith("Оставьте номер — свяжемся именно по этому автомобилю")) {
      node.textContent = "Позвоните или напишите в MAX — ответим на вопросы по выбранному автомобилю.";
    }

    if (value === "Данные этого лота уже добавятся в заявку") {
      node.textContent = "Выберите удобный способ связи";
    }
  }
}

function patchPurchaseButtons(root: ParentNode = document) {
  if (root instanceof HTMLButtonElement) patchPurchaseButton(root);

  for (const button of Array.from(root.querySelectorAll<HTMLButtonElement>("button"))) {
    patchPurchaseButton(button);
  }
}

function HeaderContacts() {
  return (
    <div className="flex items-center gap-2">
      <a
        href={PHONE_HREF}
        className="flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-[#07152f] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#ff2d3d] 2xl:px-4"
        aria-label={`Позвонить менеджеру ${PHONE_DISPLAY}`}
      >
        <PhoneIcon className="h-4 w-4" />
        <span>Позвонить</span>
        <span className="hidden 2xl:inline text-white/65">{PHONE_DISPLAY}</span>
      </a>
      <a
        href={MAX_HREF}
        target="_blank"
        rel="noreferrer"
        className="flex h-10 items-center gap-2 whitespace-nowrap rounded-xl bg-white px-3 text-xs font-black text-[#07152f] shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:ring-slate-300 2xl:px-4"
        aria-label="Написать менеджеру в MAX"
      >
        <MaxIcon className="h-4 w-4" />
        <span>MAX</span>
      </a>
    </div>
  );
}

export default function ManagerContactHub() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [headerHost, setHeaderHost] = useState<HTMLElement | null>(null);

  const isPrivate = pathname.startsWith("/crm") || pathname.startsWith("/debug");
  const isLot = pathname.startsWith("/catalog/") || /^\/china\/[^/]+/.test(pathname);

  useEffect(() => {
    if (isPrivate) return;

    patchPurchaseButtons();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) patchPurchaseButtons(node);
        }
      }
    });
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
    if (isPrivate) {
      setHeaderHost(null);
      return;
    }

    let timer = 0;
    let attempts = 0;

    function attachHeaderContacts() {
      const header = document.querySelector<HTMLElement>("header");
      const inner = header?.firstElementChild as HTMLElement | null;

      if (!header || !inner) {
        attempts += 1;
        if (attempts < 30) timer = window.setTimeout(attachHeaderContacts, 100);
        return;
      }

      const existing = document.getElementById("mosaicauto-header-manager-contacts");
      if (existing) {
        setHeaderHost(existing);
        return;
      }

      const last = inner.lastElementChild as HTMLElement | null;
      const target = last?.tagName === "DIV" ? last : inner;
      const host = document.createElement("div");
      host.id = "mosaicauto-header-manager-contacts";
      host.className = "hidden lg:flex shrink-0 items-center";
      target.appendChild(host);
      setHeaderHost(host);
    }

    attachHeaderContacts();

    return () => {
      if (timer) window.clearTimeout(timer);
      document.getElementById("mosaicauto-header-manager-contacts")?.remove();
      setHeaderHost(null);
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
      {headerHost ? createPortal(<HeaderContacts />, headerHost) : null}

      {!isLot ? (
        <div className="fixed bottom-3 left-3 right-3 z-[65] grid grid-cols-2 gap-2 lg:hidden" aria-label="Связаться с менеджером">
          <a
            href={PHONE_HREF}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#07152f] px-4 text-sm font-black text-white shadow-2xl shadow-slate-900/25"
          >
            <PhoneIcon />
            Позвонить
          </a>
          <a
            href={MAX_HREF}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-[#07152f] shadow-2xl shadow-slate-900/20 ring-1 ring-slate-200"
          >
            <MaxIcon />
            MAX
          </a>
        </div>
      ) : null}

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-[#020b1f]/65 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Обсудить детали"
            className="w-full rounded-t-[1.6rem] bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-[1.6rem] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff2d3d]">MosaicAuto</div>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#07152f]">Обсудить детали</h2>
                <p className="mt-1.5 text-sm font-medium leading-5 text-slate-500">Выберите удобный способ связи.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500 transition hover:bg-slate-200"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-2.5">
              <a
                href={PHONE_HREF}
                className="flex min-h-16 items-center gap-4 rounded-xl bg-[#07152f] px-4 py-3 text-white transition hover:bg-[#ff2d3d]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10"><PhoneIcon /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">Позвонить менеджеру</span>
                  <span className="mt-0.5 block text-xs font-bold text-white/65">{PHONE_DISPLAY}</span>
                </span>
                <span className="ml-auto text-lg text-white/45">→</span>
              </a>

              <a
                href={MAX_HREF}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-16 items-center gap-4 rounded-xl bg-[#f4f7fb] px-4 py-3 text-[#07152f] ring-1 ring-slate-200 transition hover:ring-slate-300"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200"><MaxIcon /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">Написать в MAX</span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500">Открыть чат с менеджером</span>
                </span>
                <span className="ml-auto text-lg text-[#ff2d3d]">→</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
