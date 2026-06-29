import CatalogUiCleaner from "@/components/CatalogUiCleaner";

export default function ChinaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CatalogUiCleaner />
    </>
  );
}
