"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ClientSummary = {
  phone: string;
  name: string;
  city: string | null;
  leadCount: number;
  latestAt: string;
  latestStatus: string;
  latestCar: string;
  latestMarket: string | null;
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

export default function CrmClientsDashboard() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        const response = await fetch(`/api/crm/clients?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload?.ok) throw new Error(payload?.error || "Не удалось загрузить клиентов");
        setClients(payload.clients || []);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, search ? 250 : 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search]);

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-[#07152f] text-white">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff6a77]">MosaicAuto CRM</div>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">Клиенты</h1>
              <p className="mt-1 text-sm font-semibold text-slate-300">Карточки клиентов, заявки, документы и внутренние заметки.</p>
            </div>
            <Link href="/crm" className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#07152f] transition hover:bg-[#ff2d3d] hover:text-white">
              ← К заявкам
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по имени, телефону, городу, машине или лоту"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-[#07152f] focus:bg-white focus:ring-4 focus:ring-slate-100"
          />
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="font-black">База клиентов</div>
            <div className="text-xs font-bold text-slate-400">{loading ? "Обновляем..." : `Клиентов: ${clients.length}`}</div>
          </div>

          {clients.length === 0 ? (
            <div className="p-10 text-center text-sm font-bold text-slate-400">{loading ? "Загружаем клиентов..." : "Клиенты не найдены"}</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {clients.map((client) => (
                <Link
                  key={client.phone}
                  href={`/crm/clients/${encodeURIComponent(client.phone)}`}
                  className="grid gap-4 p-5 transition hover:bg-slate-50 lg:grid-cols-[1.1fr_0.8fr_1fr_140px_auto] lg:items-center"
                >
                  <div>
                    <div className="text-lg font-black">{client.name}</div>
                    <div className="mt-1 font-black text-[#d8001f]">{client.phone}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-400">{client.city || "Город не указан"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Последнее обращение</div>
                    <div className="mt-1 text-sm font-black">{formatMsk(client.latestAt)} МСК</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Последний интерес</div>
                    <div className="mt-1 text-sm font-black">{client.latestCar}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-400">{client.latestMarket || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Заявок</div>
                    <div className="mt-1 text-2xl font-black">{client.leadCount}</div>
                  </div>
                  <div className="justify-self-start rounded-xl bg-[#07152f] px-4 py-2 text-xs font-black text-white lg:justify-self-end">Открыть клиента →</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
