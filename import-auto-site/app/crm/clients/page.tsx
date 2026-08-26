import { notFound } from "next/navigation";
import CrmClientsDashboard from "@/components/CrmClientsDashboard";
import { isCrmPageRequestAllowed } from "@/lib/crm/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CrmClientsPage() {
  if (!(await isCrmPageRequestAllowed())) notFound();
  return <CrmClientsDashboard />;
}
