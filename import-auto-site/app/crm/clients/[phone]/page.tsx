import { notFound } from "next/navigation";
import CrmClientWorkspace from "@/components/CrmClientWorkspace";
import { isCrmPageRequestAllowed } from "@/lib/crm/access";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ phone: string }> | { phone: string };

export default async function CrmClientPage({ params }: { params: Params }) {
  if (!(await isCrmPageRequestAllowed())) notFound();
  const { phone } = await params;
  return <CrmClientWorkspace phone={decodeURIComponent(phone)} />;
}
