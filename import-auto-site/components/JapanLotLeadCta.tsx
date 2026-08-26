"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import PurchaseLeadCta, { type PurchaseLeadCar } from "./PurchaseLeadCta";

type AnyCar = Record<string, any>;

function unwrapCar(payload: any): AnyCar | null {
  for (const candidate of [payload?.data, payload?.item, payload?.car, payload?.result, payload]) {
    if (!candidate || typeof candidate !== "object") continue;
    if (candidate.id || candidate.lot || candidate.brand || candidate.model) return candidate;
  }

  return null;
}

function firstPrice(car: AnyCar) {
  for (const value of [
    car.currentPrice,
    car.bidPrice,
    car.averagePrice,
    car.startPrice,
    car.finishPrice,
    car.soldPrice,
  ]) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return null;
}

export default function JapanLotLeadCta() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : String(rawId || "");
  const [car, setCar] = useState<PurchaseLeadCar | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const source = new URLSearchParams(window.location.search).get("source");
    const query = source ? `?source=${encodeURIComponent(source)}` : "";

    fetch(`/api/car/${encodeURIComponent(id)}${query}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((payload) => {
        if (cancelled || payload?.ok === false) return;

        const next = unwrapCar(payload);
        if (!next) return;

        setCar({
          market: "japan",
          country: "Япония",
          carId: String(next.id || id),
          lot: next.lot || id,
          brand: next.brand || next.marka || next.make || "",
          model: next.model || next.modelName || "",
          year: next.year || null,
          priceForeign: firstPrice(next),
          currency: "JPY",
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!car) return null;

  return (
    <div className="japan-lot-lead-cta">
      <PurchaseLeadCta car={car} variant="floating" />

      <style jsx global>{`
        @media (min-width: 640px) {
          .japan-lot-lead-cta > div.fixed {
            right: max(24px, calc((100vw - 1800px) / 2 + 12px)) !important;
          }
        }
      `}</style>
    </div>
  );
}
