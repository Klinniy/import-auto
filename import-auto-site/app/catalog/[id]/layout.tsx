import type { ReactNode } from "react";
import JapanLotLeadCta from "@/components/JapanLotLeadCta";

export default function JapanLotLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <JapanLotLeadCta />
    </>
  );
}
