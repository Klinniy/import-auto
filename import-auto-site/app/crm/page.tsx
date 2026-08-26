import { notFound } from "next/navigation";
import CrmLeadsDashboard from "@/components/CrmLeadsDashboard";
import { isCrmPageRequestAllowed } from "@/lib/crm/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CrmPage() {
  if (!(await isCrmPageRequestAllowed())) notFound();

  return <CrmLeadsDashboard />;
}
