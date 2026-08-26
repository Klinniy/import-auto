"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

export type PurchaseLeadCar = {
  market: "japan" | "china" | string;
  country: string;
  carId?: string;
  lot?: string | number | null;
  brand?: string | null;
  model?: string | null;
  year?: string | number | null;
  priceForeign?: string | number | null;
  currency?: string | null;
  calculatedTotalRub?: number | null;
};

type FormState = {
  name: string;
  phone: string;
  city: string;
  comment: string;
  company: string;
};

type Variant = "inline" | "floating" | "responsive";

const initialForm: FormState = {
  name: "",
  phone: "",
  city: "",
  comment: "",
  company: "",
};

function clean(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function carTitle(car: PurchaseLeadCar) {
  return [clean(car.brand), clean(car.model)].filter(Boolean).join(" ") || "Автомобиль";
}

function getVisitorId() {
  if (typeof window === "undefined") return "";

  const key = "mosaicauto.visitorId";

  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;

    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

    window.localStorage.setItem(key, id);
    return id;
  } catch {
    return "";
  }
}

function trackingData() {
  if (typeof window === "undefined") {
    return {
      pageUrl: "",
      visitorId: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmContent: "",
      utmTerm: "",
    };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    pageUrl: window.location.href,
    visitorId: getVisitorId(),
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    utmTerm: params.get("utm_term") || "",
  };
}

export default function PurchaseLeadCta({
  car,
  variant = "inline",
}: {
  car: PurchaseLeadCar;
  variant?: Variant;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [successId, setSuccessId] = useState("");

  const title = useMemo(() => carTitle(car), [car]);
  const lot = clean(car.lot);
  const year = clean(car.year);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    if (sending) return;
    setOpen(false);
  }

  function openForm() {
    setError("");
    setOpen(true);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    setError("");

    if (!consent) {
      setError("Подтвердите согласие на обработку данных для обратной связи.");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/leads/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: "lot_purchase",
          country: car.country,
          market: car.market,
          carId: clean(car.carId),
          lot,
          brand: clean(car.brand),
          model: clean(car.model),
          year: car.year || null,
          priceForeign: clean(car.priceForeign),
          currency: clean(car.currency),
          calculatedTotalRub: car.calculatedTotalRub || null,
          ...trackingData(),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Не удалось отправить заявку.");
      }

      setSuccessId(String(payload.id || "accepted"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить заявку.");
    } finally {
      setSending(false);
    }
  }

  const inlineCta = (
    <section className="overflow-hidden rounded-2xl bg-[#07152f] text-white shadow-xl shadow-slate-300/50 ring-1 ring-[#07152f]">
      <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#ff2d3d] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-white">
              Понравился автомобиль?
            </span>
            {lot && (
              <span className="text-xs font-bold text-slate-300">
                Лот {lot}
              </span>
            )}
          </div>

          <div className="mt-3 text-xl font-black tracking-[-0.025em] sm:text-2xl">
            Проверим лот и обсудим покупку
          </div>

          <p className="mt-1.5 max-w-3xl text-sm font-medium leading-6 text-slate-300">
            Оставьте номер — свяжемся именно по этому автомобилю, уточним детали и расскажем о следующих шагах.
          </p>
        </div>

        <div className="lg:min-w-[270px]">
          <button
            type="button"
            onClick={openForm}
            className="group min-h-14 w-full rounded-xl bg-[#ff2d3d] px-6 py-4 text-base font-black text-white shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#e51f30] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-400/30"
          >
            <span className="inline-flex items-center gap-2">
              Обсудить покупку
              <span className="text-lg transition group-hover:translate-x-1">→</span>
            </span>
          </button>
          <div className="mt-2 text-center text-[11px] font-semibold text-slate-400">
            Данные этого лота уже добавятся в заявку
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      {variant === "floating" ? (
        <div className="fixed bottom-3 left-3 right-3 z-40 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto">
          <button
            type="button"
            onClick={openForm}
            className="min-h-14 w-full rounded-xl bg-[#ff2d3d] px-7 py-4 text-base font-black text-white shadow-2xl shadow-slate-900/25 transition hover:bg-[#e51f30] focus:outline-none focus:ring-4 focus:ring-red-100 sm:min-w-[250px]"
          >
            Обсудить покупку →
          </button>
        </div>
      ) : variant === "responsive" ? (
        <>
          <div className="hidden sm:block">{inlineCta}</div>
          <div className="fixed bottom-3 left-3 right-3 z-40 sm:hidden">
            <button
              type="button"
              onClick={openForm}
              className="min-h-14 w-full rounded-xl bg-[#ff2d3d] px-6 py-4 text-base font-black text-white shadow-2xl shadow-slate-900/30 focus:outline-none focus:ring-4 focus:ring-red-100"
            >
              Обсудить покупку →
            </button>
          </div>
        </>
      ) : (
        inlineCta
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#020b1f]/70 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Обсудить покупку автомобиля"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-[1.75rem] bg-white shadow-2xl sm:max-w-xl sm:rounded-[1.75rem]"
          >
            {successId ? (
              <div className="p-6 text-center sm:p-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl font-black text-emerald-600">
                  ✓
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-[-0.035em] text-[#07152f]">
                  Заявка принята
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Мы получили ваш запрос по {title}{lot ? `, лот ${lot}` : ""} и свяжемся с вами для обсуждения покупки.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-6 min-h-12 w-full rounded-xl bg-[#07152f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff2d3d]"
                >
                  Готово
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-[#ff2d3d]">
                      Обратный звонок
                    </div>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#07152f]">
                      Обсудить покупку
                    </h2>
                    <div className="mt-2 text-sm font-bold text-slate-500">
                      {title}{year ? ` · ${year}` : ""}{lot ? ` · лот ${lot}` : ""}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={close}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 transition hover:bg-slate-200"
                    aria-label="Закрыть"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm font-black text-[#07152f]">
                      Имя
                      <input
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(event) => update("name", event.target.value)}
                        placeholder="Как к вам обращаться"
                        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#07152f] focus:ring-4 focus:ring-slate-100"
                      />
                    </label>

                    <label className="grid gap-1.5 text-sm font-black text-[#07152f]">
                      Телефон
                      <input
                        required
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(event) => update("phone", event.target.value)}
                        placeholder="+7 999 000-00-00"
                        className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#07152f] focus:ring-4 focus:ring-slate-100"
                      />
                    </label>
                  </div>

                  <label className="grid gap-1.5 text-sm font-black text-[#07152f]">
                    Город <span className="font-medium text-slate-400">необязательно</span>
                    <input
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(event) => update("city", event.target.value)}
                      placeholder="Например, Москва"
                      className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#07152f] focus:ring-4 focus:ring-slate-100"
                    />
                  </label>

                  <label className="grid gap-1.5 text-sm font-black text-[#07152f]">
                    Комментарий <span className="font-medium text-slate-400">необязательно</span>
                    <textarea
                      value={form.comment}
                      onChange={(event) => update("comment", event.target.value)}
                      placeholder="Например: интересует итоговая стоимость до Москвы"
                      rows={3}
                      className="resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[#07152f] focus:ring-4 focus:ring-slate-100"
                    />
                  </label>

                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={(event) => update("company", event.target.value)}
                    className="absolute left-[-10000px] h-px w-px opacity-0"
                    aria-hidden="true"
                  />

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs font-medium leading-5 text-slate-500">
                    <input
                      required
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#ff2d3d]"
                    />
                    <span>
                      Согласен на обработку указанных персональных данных для обратной связи по заявке.
                    </span>
                  </label>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="min-h-12 w-full rounded-xl bg-[#ff2d3d] px-5 py-3 text-base font-black text-white shadow-lg shadow-red-200 transition hover:bg-[#e51f30] disabled:cursor-wait disabled:opacity-60"
                  >
                    {sending ? "Отправляем..." : "Жду звонка"}
                  </button>

                  <p className="text-center text-[11px] leading-4 text-slate-400">
                    В заявку автоматически добавятся данные выбранного автомобиля и номер лота — повторно вводить их не нужно.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
