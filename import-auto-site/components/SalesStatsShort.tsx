"use client";

import { useEffect, useState } from "react";

type Summary = {
  ok?: boolean;
  salesCountLabel?: string;
  dataToLabel?: string;
};

export default function SalesStatsShort({
  fallback = "1 285 273 проданных авто · данные до 27.06.2026",
}: {
  fallback?: string;
}) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/statistics/summary", {
          cache: "no-store",
        });

        const data = (await response.json()) as Summary;

        if (cancelled || !data?.ok) return;

        const count = data.salesCountLabel || "";
        const date = data.dataToLabel || "";

        if (count && date) {
          setText(`${count} проданных авто · данные до ${date}`);
        } else if (count) {
          setText(`${count} проданных авто`);
        }
      } catch {
        setText(fallback);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [fallback]);

  return <>{text}</>;
}
