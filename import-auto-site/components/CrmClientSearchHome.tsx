"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function CrmClientSearchHome() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (phone.trim()) params.set("phone", phone.trim());
    if (name.trim()) params.set("name", name.trim());
    if (city.trim()) params.set("city", city.trim());

    const query = params.toString();
    router.push(query ? `/crm/clients?${query}` : "/crm/clients");
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-[#07152f] text-white shadow-xl shadow-slate-900/10">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ff6a77]">MosaicAuto</div>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.045em] sm:text-4xl">CRM</h1>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-110px)] max-w-[1100px] items-start justify-center px-4 py-12 sm:px-6 sm:py-20">
        <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#ff2d3d]">База клиентов</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">Найти клиента</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500 sm:text-base">
              Ищите по телефону, имени и городу — отдельно или одновременно. Если оставить все поля пустыми, откроется полный список клиентов.
            </p>
          </div>

          <form onSubmit={submit} className="mx-auto mt-8 grid max-w-3xl gap-4">
            <label className="grid gap-1.5 text-sm font-black">
              Номер телефона
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Например, +7 991 252-70-66"
                className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-bold outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#07152f] focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-black">
                Имя
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Например, Егор"
                  className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-bold outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#07152f] focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-black">
                Город
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Например, Чехов"
                  className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-bold outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#07152f] focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 min-h-14 rounded-xl bg-[#ff2d3d] px-6 py-3 text-base font-black text-white shadow-lg shadow-red-200 transition hover:bg-[#e51f30] focus:outline-none focus:ring-4 focus:ring-red-100"
            >
              Найти клиента →
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
