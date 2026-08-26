import type { Metadata } from "next";
import type { ReactNode } from "react";
import CrmNavigation from "@/components/CrmNavigation";

export const metadata: Metadata = {
  title: "MosaicAuto CRM",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CrmNavigation />
      {children}
    </>
  );
}
