"use client";

import { useEffect, useMemo, useState } from "react";

type DebugData = Record<string, any>;

function asText(value: any) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function Block({ title, value }: { title: string; value: any }) {
  const text = asText(value);

  async function copy() {
    await navigator.clipboard.writeText(text);
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-white">{title}</h2>
        <button
          onClick={copy}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
        >
          Копировать
        </button>
      </div>
      <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl bg-black p-4 text-xs leading-5 text-slate-100">
        {text}
      </pre>
    </section>
  );
}

export default function DebugPage() {
  const [data, setData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/debug", { cache: "no-store" });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const fullText = useMemo(() => asText(data), [data]);

  return (
    <main className="min-h-screen bg-[#0b0f17] p-6 text-white">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Mosaicauto Debug</h1>
            <p className="mt-1 text-sm text-slate-400">
              Страница для копирования диагностики проекта
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={load}
              className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-bold hover:bg-slate-700"
            >
              Обновить
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(fullText)}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold hover:bg-red-500"
            >
              Копировать всё
            </button>
          </div>
        </div>

        {loading || !data ? (
          <div className="rounded-2xl bg-slate-900 p-6 font-bold">Загрузка...</div>
        ) : (
          <div className="grid gap-4">
            <Block title="SSH public key для GitHub" value={data.ssh?.githubPublicKey} />
            <Block title="Git" value={data.git} />
            <Block title="System / PM2" value={data.system} />
            <Block title="Поиск по image / grade / mapper" value={data.search} />
            <Block title="next.config.ts" value={data.project?.nextConfig} />
            <Block title="components/CatalogFull.tsx" value={data.project?.catalogFull} />
            <Block title="lib/catalog/mapper.ts" value={data.project?.mapper} />
            <Block title="package.json" value={data.project?.packageJson} />
            <Block title="Полный JSON" value={data} />
          </div>
        )}
      </div>
    </main>
  );
}
