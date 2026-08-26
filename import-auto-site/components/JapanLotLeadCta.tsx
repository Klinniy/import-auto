"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [host, setHost] = useState<HTMLElement | null>(null);

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

  useEffect(() => {
    let attempts = 0;
    let timer = 0;

    function attach() {
      const actionButton = document.querySelector<HTMLElement>('[data-lot-action="content"]');
      const actionBar = actionButton?.closest<HTMLElement>(".mb-3");

      if (!actionBar) {
        attempts += 1;
        if (attempts < 30) timer = window.setTimeout(attach, 100);
        return;
      }

      const existing = document.getElementById("japan-lot-purchase-cta-host");
      if (existing) {
        setHost(existing);
        return;
      }

      const element = document.createElement("div");
      element.id = "japan-lot-purchase-cta-host";
      element.className = "mb-4";
      actionBar.insertAdjacentElement("afterend", element);
      setHost(element);
    }

    attach();

    return () => {
      if (timer) window.clearTimeout(timer);
      const current = document.getElementById("japan-lot-purchase-cta-host");
      current?.remove();
    };
  }, [id]);

  if (!car || !host) return null;

  return createPortal(<PurchaseLeadCta car={car} variant="responsive" />, host);
}
