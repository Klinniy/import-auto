import SiteTopBar from "@/components/SiteTopBar";
import ChinaCatalogExactClone from "@/components/ChinaCatalogExactClone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ChinaPage() {
  return (
    <>
      <SiteTopBar />
      <ChinaCatalogExactClone />
    </>
  );
}
