import { notFound } from "next/navigation";
import CrmLeadWorkspace from "@/components/CrmLeadWorkspace";
import { isCrmPageRequestAllowed } from "@/lib/crm/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }> | { id: string };

export default async function CrmLeadPage({ params }: { params: Params }) {
  if (!(await isCrmPageRequestAllowed())) notFound();
  const resolved = await params;
  const id = String(resolved?.id || "").trim();
  if (!id) notFound();
  return <CrmLeadWorkspace leadId={id} />;
}
