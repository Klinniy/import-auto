import CatalogUiCleaner from "@/components/CatalogUiCleaner";

export default function CatalogLayout({
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
