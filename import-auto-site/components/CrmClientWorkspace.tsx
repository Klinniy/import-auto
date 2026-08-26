"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Lead = {
  publicId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
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
};

type Note = { publicId: string; createdAt: string; text: string };
type ClientFile = { publicId: string; createdAt: string; originalName: string; mimeType: string; sizeBytes: number };
type ClientData = {
  phone: string;
  name: string;
  city: string | null;
  leads: Lead[];
  notes: Note[];
  files: ClientFile[];
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

function formatBytes(value: number) {
  if (value < 1024) return `${value} Б`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} КБ`;
  return `${(value / 1024 / 1024).toFixed(1)} МБ`;
}

function carTitle(lead: Lead) {
  return [lead.brand, lead.model, lead.year].filter(Boolean).join(" ") || "Автомобиль";
}

export default function CrmClientWorkspace({ phone }: { phone: string }) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [uploading, setUploading] = useState(false);

  const encodedPhone = useMemo(() => encodeURIComponent(phone), [phone]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/crm/clients/${encodedPhone}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Не удалось загрузить клиента");
      setClient(payload.client);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки клиента");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encodedPhone]);

  async function submitNote(event: FormEvent) {
    event.preventDefault();
    if (!note.trim() || savingNote) return;
    setSavingNote(true);
    setError("");
    try {
      const response = await fetch(`/api/crm/clients/${encodedPhone}/notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: note }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Не удалось сохранить заметку");
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения заметки");
    } finally {
      setSavingNote(false);
    }
  }

  async function uploadFile(file: File | null) {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(`/api/crm/clients/${encodedPhone}/files`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Не удалось загрузить файл");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  }

  async function deleteFile(fileId: string) {
    if (!window.confirm("Удалить этот файл из карточки клиента?")) return;
    setError("");
    try {
      const response = await fetch(`/api/crm/clients/${encodedPhone}/files/${encodeURIComponent(fileId)}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Не удалось удалить файл");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления файла");
    }
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-[#07152f] text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff6a77]">MosaicAuto CRM · клиент</div>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">{client?.name || (loading ? "Загрузка..." : "Карточка клиента")}</h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm font-bold text-slate-300">
                <span>{phone}</span>
                {client?.city && <span>· {client.city}</span>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/crm/clients" className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white hover:text-[#07152f]">← Клиенты</Link>
              <Link href="/crm/leads" className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#07152f] transition hover:bg-[#ff2d3d] hover:text-white">Заявки</Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

        {loading && !client ? (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-slate-400">Загружаем карточку клиента...</div>
        ) : !client ? (
          <div className="rounded-2xl bg-white p-10 text-center font-bold text-slate-500">Клиент не найден</div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Клиент</div>
                    <div className="mt-2 text-2xl font-black">{client.name}</div>
                    <a href={`tel:${client.phone}`} className="mt-1 inline-block text-lg font-black text-[#d8001f] hover:underline">{client.phone}</a>
                    <div className="mt-1 text-sm font-semibold text-slate-500">{client.city || "Город не указан"}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Заявок</div>
                    <div className="mt-1 text-3xl font-black">{client.leads.length}</div>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="text-lg font-black">История обращений</div>
                  <div className="mt-1 text-xs font-semibold text-slate-400">Все заявки этого клиента объединяются по номеру телефона.</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {client.leads.map((lead) => (
                    <div key={lead.publicId} className="p-5 transition hover:bg-slate-50/70">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-lg font-black">{carTitle(lead)}</div>
                          <div className="mt-1 text-xs font-bold text-slate-400">{lead.country || lead.market || "—"} · лот {lead.lot || "—"} · {formatMsk(lead.createdAt)} МСК</div>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{lead.status}</span>
                      </div>
                      {lead.comment && <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-600">{lead.comment}</div>}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/crm/leads/${encodeURIComponent(lead.publicId)}`}
                          className="inline-flex rounded-xl bg-[#ff2d3d] px-4 py-2 text-xs font-black text-white transition hover:bg-[#e51f30]"
                        >
                          Открыть заявку →
                        </Link>
                        {lead.pageUrl && <a href={lead.pageUrl} target="_blank" rel="noreferrer" className="inline-flex rounded-xl bg-[#07152f] px-4 py-2 text-xs font-black text-white hover:bg-slate-800">Открыть автомобиль ↗</a>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-lg font-black">Внутренние заметки</div>
                <p className="mt-1 text-xs font-semibold text-slate-400">Заметки видны только сотрудникам CRM и относятся ко всему клиенту, а не к одной заявке.</p>
                <form onSubmit={submitNote} className="mt-4">
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={4}
                    placeholder="Например: созвонились, интересуется Alphard до 4,5 млн, повторный звонок в пятницу"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-[#07152f] focus:bg-white focus:ring-4 focus:ring-slate-100"
                  />
                  <button disabled={savingNote || !note.trim()} className="mt-3 min-h-11 w-full rounded-xl bg-[#07152f] px-4 py-2 text-sm font-black text-white transition hover:bg-[#ff2d3d] disabled:opacity-50">
                    {savingNote ? "Сохраняем..." : "Добавить заметку"}
                  </button>
                </form>
                <div className="mt-5 space-y-3">
                  {client.notes.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-center text-xs font-bold text-slate-400">Заметок пока нет</div>
                  ) : client.notes.map((item) => (
                    <div key={item.publicId} className="rounded-xl bg-slate-50 p-4">
                      <div className="text-xs font-black text-slate-400">{formatMsk(item.createdAt)} МСК</div>
                      <div className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">{item.text}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-lg font-black">Документы клиента</div>
                <p className="mt-1 text-xs font-semibold text-slate-400">Договоры, инвойсы, паспорта документов, фото, таблицы и другая рабочая документация.</p>
                <label className="mt-4 flex min-h-24 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 text-center transition hover:border-[#ff2d3d] hover:bg-red-50/30">
                  <div>
                    <div className="font-black">{uploading ? "Загружаем..." : "＋ Прикрепить файл"}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-400">PDF, фото, Word, Excel, CSV, TXT, ZIP · до 25 МБ</div>
                  </div>
                  <input
                    type="file"
                    disabled={uploading}
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      uploadFile(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>

                <div className="mt-4 space-y-2">
                  {client.files.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-center text-xs font-bold text-slate-400">Документов пока нет</div>
                  ) : client.files.map((file) => (
                    <div key={file.publicId} className="rounded-xl border border-slate-200 p-3">
                      <div className="min-w-0 font-black break-words">{file.originalName}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-400">{formatBytes(file.sizeBytes)} · {formatMsk(file.createdAt)} МСК</div>
                      <div className="mt-3 flex gap-2">
                        <a
                          href={`/api/crm/clients/${encodedPhone}/files/${encodeURIComponent(file.publicId)}`}
                          className="flex-1 rounded-lg bg-[#07152f] px-3 py-2 text-center text-xs font-black text-white hover:bg-[#ff2d3d]"
                        >
                          Скачать
                        </a>
                        <button
                          type="button"
                          onClick={() => deleteFile(file.publicId)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-50"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
