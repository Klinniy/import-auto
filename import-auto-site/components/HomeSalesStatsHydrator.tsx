"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Summary = {
  ok?: boolean;
  salesCount?: number;
  salesCountLabel?: string;
  dataToLabel?: string;
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findSalesCard() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("a, article, section, div"));

  const titleNodes = nodes.filter((node) => {
    const text = normalizeText(node.textContent || "");
    return text.includes("статистика продаж");
  });

  let best: HTMLElement | null = null;

  for (const node of titleNodes) {
    const link = node.closest<HTMLElement>("a");
    if (link) return link;

    let current: HTMLElement | null = node;

    for (let i = 0; i < 8 && current; i += 1) {
      const rect = current.getBoundingClientRect();
      const text = normalizeText(current.textContent || "");

      if (
        text.includes("статистика продаж") &&
        rect.width >= 260 &&
        rect.height >= 120 &&
        rect.width <= 900 &&
        rect.height <= 420
      ) {
        if (!best) {
          best = current;
        } else {
          const bestRect = best.getBoundingClientRect();
          if (rect.width * rect.height < bestRect.width * bestRect.height) {
            best = current;
          }
        }
      }

      current = current.parentElement;
    }
  }

  return best;
}

function removeDevelopmentTexts(card: HTMLElement) {
  const nodes = Array.from(card.querySelectorAll<HTMLElement>("*"));

  for (const node of nodes) {
    const text = normalizeText(node.textContent || "");

    if (
      text === "скоро" ||
      text === "скоро подключим" ||
      text === "раздел в разработке" ||
      text === "скоро появится"
    ) {
      node.remove();
    }
  }
}

function updateDescription(card: HTMLElement) {
  const nodes = Array.from(card.querySelectorAll<HTMLElement>("p, span, div"));

  for (const node of nodes) {
    const text = normalizeText(node.textContent || "");

    if (
      text === "аналитика продаж" ||
      text.includes("раздел в разработке") ||
      text.includes("скоро подключим")
    ) {
      node.textContent = "аналитика по проданным лотам";
      node.style.color = "rgba(255,255,255,.78)";
      node.style.fontWeight = "800";
    }
  }
}

function makeClickable(card: HTMLElement) {
  const link = card.closest<HTMLAnchorElement>("a");

  if (link) {
    link.href = "/statistics";
    return;
  }

  if (card.dataset.salesCardClickable === "1") return;

  card.dataset.salesCardClickable = "1";
  card.setAttribute("role", "link");
  card.setAttribute("tabindex", "0");
  card.style.cursor = "pointer";

  const open = (event?: Event) => {
    event?.preventDefault();
    window.location.href = "/statistics";
  };

  card.addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      open(event);
    }
  });
}

function renderSummary(card: HTMLElement, summary: Summary) {
  const old = card.querySelector("[data-japan-sales-summary]");
  if (old) old.remove();

  const box = document.createElement("div");
  box.dataset.japanSalesSummary = "1";

  box.style.marginTop = "12px";
  box.style.display = "grid";
  box.style.gap = "6px";

  const count = summary.salesCountLabel || "—";
  const date = summary.dataToLabel || "—";

  box.innerHTML = `
    <div style="
      width:max-content;
      max-width:100%;
      border-radius:999px;
      padding:7px 11px;
      background:rgba(255,255,255,.14);
      color:#fff;
      font-size:13px;
      font-weight:900;
      line-height:1.1;
      letter-spacing:.02em;
    ">
      ${count} проданных авто
    </div>
    <div style="
      color:rgba(255,255,255,.78);
      font-size:13px;
      font-weight:800;
      line-height:1.25;
    ">
      данные до ${date}
    </div>
  `;

  card.appendChild(box);
}

export default function HomeSalesStatsHydrator() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/japan") return;

    let cancelled = false;

    async function apply() {
      try {
        const response = await fetch("/api/statistics/summary", {
          cache: "no-store",
        });

        const summary = (await response.json()) as Summary;

        if (cancelled || !summary?.ok) return;

        const card = findSalesCard();

        if (!card) return;

        makeClickable(card);
        removeDevelopmentTexts(card);
        updateDescription(card);
        renderSummary(card, summary);
      } catch {
        // Не ломаем страницу Японии, если API временно не ответил.
      }
    }

    apply();

    const timer1 = window.setTimeout(apply, 300);
    const timer2 = window.setTimeout(apply, 900);
    const timer3 = window.setTimeout(apply, 1800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, [pathname]);

  return null;
}
