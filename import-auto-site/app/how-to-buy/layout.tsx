import type { Metadata } from "next";
import type { ReactNode } from "react";
import SeoJsonLd from "@/components/SeoJsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: {
    canonical: "/how-to-buy",
  },
  openGraph: {
    url: "/how-to-buy",
  },
};

export default function HowToBuyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "MosaicAuto", path: "/" },
          { name: "Как купить", path: "/how-to-buy" },
        ])}
      />
      {children}
    </>
  );
}
