import { notFound } from "next/navigation";
import CrmClientsDashboard from "@/components/CrmClientsDashboard";
import { isCrmPageRequestAllowed } from "@/lib/crm/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function CrmClientsPage({ searchParams }: { searchParams: SearchParams }) {
  if (!(await isCrmPageRequestAllowed())) notFound();

  const params = await searchParams;

  return (
    <CrmClientsDashboard
      initialPhone={one(params.phone)}
      initialName={one(params.name)}
      initialCity={one(params.city)}
    />
  );
}
