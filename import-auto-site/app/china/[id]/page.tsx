// @ts-nocheck
import Link from "next/link";
import ChinaLotTabs from "@/components/ChinaLotTabs";
import { getChinaLot } from "@/lib/china/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }> | { id: string };

export default async function ChinaLotPage({
  params,
}: {
  params: Params;
}) {
  const p = await params;
  const car = await getChinaLot(p.id);

  if (!car) {
    return (
      <main className="min-h-screen bg-[#f4f7fb] p-8 text-[#07152f]">
        <div className="mx-auto max-w-4xl rounded-2xl bg-red-50 p-8 text-center ring-1 ring-red-200">
          <h1 className="text-2xl font-black text-red-700">Лот не найден</h1>
          <Link
            href="/china"
            className="mt-5 inline-flex rounded-xl bg-[#07152f] px-5 py-3 font-black text-white"
          >
            Вернуться в каталог Китая
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-[#07152f]">
      <header className="border-t-4 border-[#ff2d3d] bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
          <Link
            href="/china"
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-[#07152f] hover:text-white"
          >
            ← В каталог Китая
          </Link>

          <Link
            href="/"
            className="rounded-xl bg-[#07152f] px-5 py-3 text-sm font-black text-white transition hover:bg-[#ff2d3d]"
          >
            На главную
          </Link>
        </div>
      </header>

      <ChinaLotTabs car={car} />
    </main>
  );
}
