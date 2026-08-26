"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LeadStatus = "NEW" | "IN_PROGRESS" | "CONTACTED" | "QUALIFIED" | "DEAL" | "CLOSED";

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

const STATUS_ORDER: LeadStatus[] = ["NEW", "IN_PROGRESS", "CONTACTED", "QUALIFIED", "DEAL", "CLOSED"];
const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  CONTACTED: "Связались",
  QUALIFIED: "Квалифицирован",
  DEAL: "Сделка",
  CLOSED: "Закрыта",
};

function formatMsk(value: string) {
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

function formatMoney(value: string | number | null, currency?: string | null) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${new Intl.NumberFormat("ru-RU").format(Math.round(n))}${currency ? ` ${currency}` : ""}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
      <div className="text-[11px] font-black uppercase tracking-[0.09em] text-slate-400">{label}</div>
      <div className="min-w-0 break-words text-sm font-bold text-[#07152f]">{value || "—"}</div>
    </div>
  );
}

export default function CrmLeadWorkspace({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(leadId)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload.lead) throw new Error(payload?.error || "Не удалось загрузить заявку");
      setLead(payload.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки заявки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  async function changeStatus(status: LeadStatus) {
    if (!lead || saving || status === lead.status) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/crm/leads/${encodeURIComponent(lead.publicId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok || !payload.lead) throw new Error(payload?.error || "Не удалось изменить статус");
      setLead(payload.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка изменения статуса");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !lead) {
    return <main className="min-h-screen bg-[#f3f6fb] p-10 text-center font-bold text-slate-400">Загружаем заявку...</main>;
  }

  if (!lead) {
    return <main className="min-h-screen bg-[#f3f6fb] p-10 text-center font-bold text-slate-500">{error || "Заявка не найдена"}</main>;
  }

  const clientHref = `/crm/clients/${encodeURIComponent(lead.phone)}`;
  const carTitle = [lead.brand, lead.model, lead.year].filter(Boolean).join(" ") || "Автомобиль";

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-[#07152f] text-white">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff6a77]">MosaicAuto CRM · заявка</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">{carTitle}</h1>
            <div className="mt-2 text-sm font-bold text-slate-300">{lead.name} · {lead.phone}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={clientHref} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white hover:text-[#07152f]">← К клиенту</Link>
            <Link href="/crm/leads" className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#07152f] transition hover:bg-[#ff2d3d] hover:text-white">Все заявки</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Заявка</div>
                  <div className="mt-2 text-2xl font-black">{lead.publicId}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-500">Создана {formatMsk(lead.createdAt)} МСК</div>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Текущий статус</div>
                  <div className="mt-1 text-lg font-black">{STATUS_LABEL[lead.status]}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={saving}
                    onClick={() => changeStatus(status)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-black transition ${lead.status === status ? "border-[#07152f] bg-[#07152f] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#07152f]"} disabled:opacity-50`}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-black">Клиент</div>
              <div className="mt-3">
                <Row label="Имя" value={lead.name} />
                <Row label="Телефон" value={<a className="text-[#d8001f] hover:underline" href={`tel:${lead.phone}`}>{lead.phone}</a>} />
                <Row label="Город" value={lead.city || "—"} />
              </div>
              <Link href={clientHref} className="mt-4 inline-flex rounded-xl bg-[#07152f] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#ff2d3d]">Открыть карточку клиента →</Link>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-lg font-black">Автомобиль</div>
                  <div className="mt-2 text-2xl font-black">{carTitle}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-500">{lead.country || lead.market || "—"} · лот {lead.lot || "—"}</div>
                </div>
                {lead.pageUrl && <a href={lead.pageUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-[#ff2d3d] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#e51f30]">Открыть автомобиль ↗</a>}
              </div>
              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                <div><div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Цена в источнике</div><div className="mt-1 font-black">{formatMoney(lead.priceForeign, lead.currency)}</div></div>
                <div><div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Расчёт до РФ</div><div className="mt-1 font-black">{formatMoney(lead.calculatedTotalRub, "RUB")}</div></div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-black">Комментарий клиента</div>
              <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">{lead.comment || "Комментарий не оставлен"}</div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-lg font-black">Технические данные заявки</div>
              <div className="mt-3">
                <Row label="Источник" value={lead.source} />
                <Row label="Visitor ID" value={lead.visitorId || "—"} />
                <Row label="UTM source" value={lead.utmSource || "—"} />
                <Row label="UTM medium" value={lead.utmMedium || "—"} />
                <Row label="UTM campaign" value={lead.utmCampaign || "—"} />
                <Row label="UTM content" value={lead.utmContent || "—"} />
                <Row label="UTM term" value={lead.utmTerm || "—"} />
                <Row label="Referrer" value={lead.referrer || "—"} />
                <Row label="Обновлена" value={`${formatMsk(lead.updatedAt)} МСК`} />
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
