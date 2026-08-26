"use client";

import { useEffect, useMemo, useState } from "react";

type LeadStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "CONTACTED"
  | "QUALIFIED"
  | "DEAL"
  | "CLOSED";

type Lead = {
  id: number;
  publicId: string;
  createdAt: string;
  updatedAt: string;
  status: LeadStatus;
  source: string;
  name: string;
  phone: string;
  city: string | null;
  comment: string | null;
  country: string | null;
  market: string | null;
  lot: string | null;
  carId: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  priceForeign: string | null;
  currency: string | null;
  calculatedTotalRub: number | null;
  pageUrl: string | null;
  visitorId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  userAgent: string | null;
};

type Stats = Record<LeadStatus, number> & { TOTAL: number };

type Payload = {
  ok?: boolean;
  leads?: Lead[];
  stats?: Stats;
  error?: string;
};

const STATUS_ORDER: LeadStatus[] = [
  "NEW",
  "IN_PROGRESS",
  "CONTACTED",
  "QUALIFIED",
  "DEAL",
  "CLOSED",
];

const STATUS_META: Record<LeadStatus, { label: string; chip: string; dot: string }> = {
  NEW: {
    label: "Новая",
    chip: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-[#ff2d3d]",
  },
  IN_PROGRESS: {
    label: "В работе",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  CONTACTED: {
    label: "Связались",
    chip: "bg-sky-50 text-sky-700 ring-sky-200",
    dot: "bg-sky-500",
  },
  QUALIFIED: {
    label: "Квалифицирован",
    chip: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
  },
  DEAL: {
    label: "Сделка",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    label: "Закрыта",
    chip: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
  },
};

function formatMsk(value: string) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMoney(value: string | number | null | undefined, currency?: string | null) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";

  const suffix = currency === "JPY" ? "¥" : currency === "CNY" ? "¥" : currency || "";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n))}${suffix ? ` ${suffix}` : ""}`;
}

function carTitle(lead: Lead) {
  return [lead.brand, lead.model].filter(Boolean).join(" ") || "Автомобиль";
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status] || STATUS_META.NEW;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${meta.chip}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function EmptyValue({ value }: { value: unknown }) {
  const text = String(value ?? "").trim();
  return <>{text || "—"}</>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-4">
      <div className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{label}</div>
      <div className="min-w-0 break-words text-sm font-bold text-[#07152f]">{children}</div>
    </div>
  );
}

export default function CrmLeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats>({
    TOTAL: 0,
    NEW: 0,
    IN_PROGRESS: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    DEAL: 0,
    CLOSED: 0,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [market, setMarket] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  const visibleTotal = useMemo(() => leads.length, [leads]);

  async function load(signal?: AbortSignal) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (market) params.set("market", market);
      params.set("limit", "200");

      const response = await fetch(`/api/crm/leads?${params.toString()}`, {
        cache: "no-store",
        signal,
      });
      const payload = (await response.json()) as Payload;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Не удалось загрузить заявки");
      }

      setLeads(payload.leads || []);
      if (payload.stats) setStats(payload.stats);

      if (selected) {
        const refreshed = (payload.leads || []).find((lead) => lead.publicId === selected.publicId);
        if (refreshed) setSelected(refreshed);
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Не удалось загрузить заявки");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => load(controller.signal), search ? 280 : 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, market]);

  async function changeStatus(nextStatus: LeadStatus) {
    if (!selected || nextStatus === selected.status || savingStatus) return;

    setSavingStatus(true);
    setError("");

    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(selected.publicId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.ok || !payload.lead) {
        throw new Error(payload?.error || "Не удалось изменить статус");
      }

      setSelected(payload.lead);
      setLeads((current) =>
        current.map((lead) => (lead.publicId === payload.lead.publicId ? payload.lead : lead))
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось изменить статус");
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-[#07152f] text-white shadow-xl shadow-slate-900/10">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff6a77]">MosaicAuto</div>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.045em] sm:text-4xl">CRM · заявки клиентов</h1>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                Внутренняя панель обработки заявок с лотов Японии и Китая.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
              <span className="rounded-full bg-white/10 px-3 py-1.5">Всего заявок: {stats.TOTAL}</span>
              <button
                type="button"
                onClick={() => load()}
                className="rounded-xl bg-white px-4 py-2.5 font-black text-[#07152f] transition hover:bg-[#ff2d3d] hover:text-white"
              >
                Обновить
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {STATUS_ORDER.map((item) => {
            const meta = STATUS_META[item];
            const active = status === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setStatus((current) => (current === item ? "" : item))}
                className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                  active
                    ? "border-[#07152f] bg-[#07152f] text-white"
                    : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <span className={`text-2xl font-black ${active ? "text-white" : "text-[#07152f]"}`}>
                    {stats[item] || 0}
                  </span>
                </div>
                <div className={`mt-3 text-sm font-black ${active ? "text-white" : "text-slate-600"}`}>
                  {meta.label}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
            <label className="relative block">
              <span className="sr-only">Поиск</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Имя, телефон, лот, марка или модель"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#07152f] focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <select
              value={market}
              onChange={(event) => setMarket(event.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-[#07152f]"
            >
              <option value="">Все рынки</option>
              <option value="japan">Япония</option>
              <option value="china">Китай</option>
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-[#07152f]"
            >
              <option value="">Все статусы</option>
              {STATUS_ORDER.map((item) => (
                <option key={item} value={item}>{STATUS_META[item].label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("");
                setMarket("");
              }}
              className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-500 transition hover:border-[#07152f] hover:text-[#07152f]"
            >
              Сбросить
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="text-sm font-black">Заявки</div>
            <div className="text-xs font-bold text-slate-400">
              {loading ? "Обновляем..." : `Показано: ${visibleTotal}`}
            </div>
          </div>

          {loading && leads.length === 0 ? (
            <div className="p-10 text-center text-sm font-bold text-slate-400">Загружаем заявки...</div>
          ) : leads.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-lg font-black text-slate-500">Заявок по выбранным условиям нет</div>
              <div className="mt-1 text-sm font-medium text-slate-400">Измените фильтр или строку поиска.</div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1120px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Дата</th>
                      <th className="px-4 py-3">Статус</th>
                      <th className="px-4 py-3">Клиент</th>
                      <th className="px-4 py-3">Автомобиль</th>
                      <th className="px-4 py-3">Лот</th>
                      <th className="px-4 py-3">Рынок</th>
                      <th className="px-4 py-3">Комментарий</th>
                      <th className="px-5 py-3 text-right">Действие</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                      <tr key={lead.publicId} className="transition hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-slate-500">
                          {formatMsk(lead.createdAt)}
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={lead.status} /></td>
                        <td className="px-4 py-4">
                          <div className="font-black text-[#07152f]">{lead.name}</div>
                          <a href={`tel:${lead.phone}`} className="mt-1 block text-xs font-bold text-[#d8001f] hover:underline">
                            {lead.phone}
                          </a>
                          <div className="mt-0.5 text-xs font-medium text-slate-400">{lead.city || "Город не указан"}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-black">{carTitle(lead)}</div>
                          <div className="mt-1 text-xs font-bold text-slate-400">{lead.year || "—"}</div>
                        </td>
                        <td className="px-4 py-4 font-black">{lead.lot || "—"}</td>
                        <td className="px-4 py-4 font-bold text-slate-600">{lead.country || lead.market || "—"}</td>
                        <td className="max-w-[300px] px-4 py-4 text-xs font-medium leading-5 text-slate-500">
                          <div className="line-clamp-2">{lead.comment || "—"}</div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelected(lead)}
                            className="rounded-xl bg-[#07152f] px-4 py-2 text-xs font-black text-white transition hover:bg-[#ff2d3d]"
                          >
                            Открыть
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {leads.map((lead) => (
                  <button
                    key={lead.publicId}
                    type="button"
                    onClick={() => setSelected(lead)}
                    className="block w-full p-4 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-black text-[#07152f]">{lead.name}</div>
                        <div className="mt-1 text-sm font-bold text-[#d8001f]">{lead.phone}</div>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <div className="font-black">{carTitle(lead)} {lead.year ? `· ${lead.year}` : ""}</div>
                      <div className="mt-1 text-xs font-bold text-slate-500">
                        {lead.country || "—"} · лот {lead.lot || "—"}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>{formatMsk(lead.createdAt)}</span>
                      <span>Открыть →</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-[#020b1f]/60 backdrop-blur-[2px]" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setSelected(null);
        }}>
          <aside className="h-full w-full overflow-y-auto bg-white shadow-2xl sm:max-w-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-[#ff2d3d]">Карточка заявки</div>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.035em]">{selected.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={selected.status} />
                    <span className="text-xs font-bold text-slate-400">{formatMsk(selected.createdAt)} МСК</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-500 transition hover:bg-slate-200"
                  aria-label="Закрыть"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <section className="rounded-2xl bg-[#07152f] p-5 text-white">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Клиент</div>
                <div className="mt-2 text-2xl font-black">{selected.name}</div>
                <a href={`tel:${selected.phone}`} className="mt-1 inline-block text-lg font-black text-[#ff6a77] hover:underline">
                  {selected.phone}
                </a>
                <div className="mt-1 text-sm font-bold text-slate-300">{selected.city || "Город не указан"}</div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Статус заявки</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {STATUS_ORDER.map((item) => {
                    const active = selected.status === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={savingStatus}
                        onClick={() => changeStatus(item)}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-black transition ${
                          active
                            ? "border-[#07152f] bg-[#07152f] text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#07152f] hover:text-[#07152f]"
                        } disabled:opacity-50`}
                      >
                        {STATUS_META[item].label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Автомобиль</div>
                    <div className="mt-2 text-xl font-black">{carTitle(selected)}</div>
                    <div className="mt-1 text-sm font-bold text-slate-500">
                      {selected.year || "—"} · {selected.country || selected.market || "—"} · лот {selected.lot || "—"}
                    </div>
                  </div>

                  {selected.pageUrl && (
                    <a
                      href={selected.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ff2d3d] px-4 py-2 text-sm font-black text-white transition hover:bg-[#e51f30]"
                    >
                      Открыть автомобиль ↗
                    </a>
                  )}
                </div>

                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Цена в источнике</div>
                    <div className="mt-1 text-sm font-black">{formatMoney(selected.priceForeign, selected.currency)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Расчёт до РФ</div>
                    <div className="mt-1 text-sm font-black">{formatMoney(selected.calculatedTotalRub, "RUB")}</div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Комментарий клиента</div>
                <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
                  {selected.comment || "Комментарий не оставлен"}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Данные заявки</div>
                <div className="mt-2">
                  <DetailRow label="ID заявки"><EmptyValue value={selected.publicId} /></DetailRow>
                  <DetailRow label="Источник"><EmptyValue value={selected.source} /></DetailRow>
                  <DetailRow label="Visitor ID"><EmptyValue value={selected.visitorId} /></DetailRow>
                  <DetailRow label="UTM source"><EmptyValue value={selected.utmSource} /></DetailRow>
                  <DetailRow label="UTM medium"><EmptyValue value={selected.utmMedium} /></DetailRow>
                  <DetailRow label="UTM campaign"><EmptyValue value={selected.utmCampaign} /></DetailRow>
                  <DetailRow label="Referrer"><EmptyValue value={selected.referrer} /></DetailRow>
                  <DetailRow label="Обновлена">{formatMsk(selected.updatedAt)} МСК</DetailRow>
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
