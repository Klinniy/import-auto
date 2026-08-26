"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

type Props = {
  initialPhone: string;
  initialName: string;
  initialCity: string;
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

export default function CrmClientsDashboard({ initialPhone, initialName, initialCity }: Props) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPhone(initialPhone);
    setName(initialName);
    setCity(initialCity);
  }, [initialPhone, initialName, initialCity]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (initialPhone.trim()) params.set("phone", initialPhone.trim());
        if (initialName.trim()) params.set("name", initialName.trim());
        if (initialCity.trim()) params.set("city", initialCity.trim());
        params.set("limit", "1000");

        const response = await fetch(`/api/crm/clients?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Не удалось загрузить клиентов");
        }

        setClients(payload.clients || []);
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Ошибка загрузки");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [initialPhone, initialName, initialCity]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (phone.trim()) params.set("phone", phone.trim());
    if (name.trim()) params.set("name", name.trim());
    if (city.trim()) params.set("city", city.trim());

    const query = params.toString();
    router.push(query ? `/crm/clients?${query}` : "/crm/clients");
  }

  function clearFilters() {
    setPhone("");
    setName("");
    setCity("");
    router.push("/crm/clients");
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-[#07152f] text-white shadow-xl shadow-slate-900/10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff6a77]">MosaicAuto CRM</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">Клиенты</h1>
            <p className="mt-1 text-sm font-semibold text-slate-300">Поиск и база клиентов.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/crm"
              className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white hover:text-[#07152f]"
            >
              ← Поиск
            </Link>
            <Link
              href="/crm/leads"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#07152f] transition hover:bg-[#ff2d3d] hover:text-white"
            >
              Заявки
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr_1fr_auto_auto] lg:items-end">
            <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
              Телефон
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 999 000-00-00"
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold normal-case tracking-normal text-[#07152f] outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#07152f] focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
              Имя
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Имя клиента"
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold normal-case tracking-normal text-[#07152f] outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#07152f] focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <label className="grid gap-1.5 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
              Город
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Город"
                className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold normal-case tracking-normal text-[#07152f] outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#07152f] focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <button
              type="submit"
              className="h-12 rounded-xl bg-[#ff2d3d] px-5 text-sm font-black text-white transition hover:bg-[#e51f30]"
            >
              Найти
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-500 transition hover:border-[#07152f] hover:text-[#07152f]"
            >
              Все клиенты
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="font-black">База клиентов</div>
            <div className="text-xs font-bold text-slate-400">
              {loading ? "Обновляем..." : `Клиентов: ${clients.length}`}
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="p-10 text-center text-sm font-bold text-slate-400">
              {loading ? "Загружаем клиентов..." : "Клиенты не найдены"}
            </div>
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

                  <div className="justify-self-start rounded-xl bg-[#07152f] px-4 py-2 text-xs font-black text-white lg:justify-self-end">
                    Открыть клиента →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
