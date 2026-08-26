import Link from "next/link";
import { notFound } from "next/navigation";
import CrmLeadsDashboard from "@/components/CrmLeadsDashboard";
import { isCrmPageRequestAllowed } from "@/lib/crm/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CrmPage() {
  if (!(await isCrmPageRequestAllowed())) notFound();

  return (
    <>
      <CrmLeadsDashboard />
      <Link
        href="/crm/clients"
        className="fixed bottom-5 left-5 z-40 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#07152f] shadow-2xl ring-1 ring-slate-200 transition hover:bg-[#ff2d3d] hover:text-white sm:bottom-6 sm:left-6"
      >
        Клиенты и документы →
      </Link>
    </>
  );
}
