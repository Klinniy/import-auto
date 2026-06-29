"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STYLE_ID = "mosaic-catalog-ui-cleaner-v4";

const css = `
body.mosaic-catalog-clean-v4 [data-mosaic-hide="true"] {
  display: none !important;
}

/* Общие переходы — только для конкретных интерактивных элементов */
body.mosaic-catalog-clean-v4 form input,
body.mosaic-catalog-clean-v4 form select,
body.mosaic-catalog-clean-v4 form button,
body.mosaic-catalog-clean-v4 form a,
body.mosaic-catalog-clean-v4 form label,
body.mosaic-catalog-clean-v4 table tbody tr,
body.mosaic-catalog-clean-v4 table a,
body.mosaic-catalog-clean-v4 table button {
  transition:
    background-color .14s ease,
    border-color .14s ease,
    box-shadow .14s ease,
    color .14s ease,
    transform .10s ease,
    opacity .14s ease;
}

/* Поля: hover только на само поле */
body.mosaic-catalog-clean-v4 form input:not([type="range"]):hover,
body.mosaic-catalog-clean-v4 form select:hover {
  border-color: rgba(7, 21, 47, .42) !important;
  box-shadow: 0 0 0 1px rgba(7, 21, 47, .05) !important;
}

body.mosaic-catalog-clean-v4 form input:not([type="range"]):focus,
body.mosaic-catalog-clean-v4 form select:focus,
body.mosaic-catalog-clean-v4 form input:not([type="range"])[data-mosaic-field-active="true"],
body.mosaic-catalog-clean-v4 form select[data-mosaic-field-active="true"] {
  border-color: #ff2d3d !important;
  box-shadow: 0 0 0 2px rgba(255, 45, 61, .12) !important;
}

/* ВАЖНО: ползунки не должны получать красную рамку активного поля */
body.mosaic-catalog-clean-v4 form input[type="range"],
body.mosaic-catalog-clean-v4 form input[type="range"]:hover,
body.mosaic-catalog-clean-v4 form input[type="range"]:focus,
body.mosaic-catalog-clean-v4 form input[type="range"][data-mosaic-field-active="true"] {
  border: 0 !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
  accent-color: #ff2d3d !important;
}

body.mosaic-catalog-clean-v4 form input[type="range"]::-webkit-slider-runnable-track {
  height: 4px !important;
  border-radius: 999px !important;
  background: #e5eaf2 !important;
}

body.mosaic-catalog-clean-v4 form input[type="range"]::-webkit-slider-thumb {
  width: 14px !important;
  height: 14px !important;
  margin-top: -5px !important;
  border: 2px solid #ff2d3d !important;
  border-radius: 999px !important;
  background: #fff !important;
  cursor: pointer !important;
}

/* Марка / модель: строки в size-select */
body.mosaic-catalog-clean-v4 select[size] {
  cursor: pointer !important;
}

body.mosaic-catalog-clean-v4 select[size] option {
  padding: 2px 5px !important;
  cursor: pointer !important;
}

body.mosaic-catalog-clean-v4 select[size] option:hover {
  background: #eef3f8 !important;
  color: #07152f !important;
}

body.mosaic-catalog-clean-v4 select[size] option:checked,
body.mosaic-catalog-clean-v4 select[size] option:focus {
  background: #07152f !important;
  color: #ffffff !important;
}

/* Firefox/Chromium fallback для выбранного option */
body.mosaic-catalog-clean-v4 select[size]:focus option:checked {
  background: linear-gradient(#07152f, #07152f) !important;
  color: #ffffff !important;
}

/* Чекбоксы: подсвечиваем только строку чекбокса */
body.mosaic-catalog-clean-v4 input[type="checkbox"] {
  accent-color: #ff2d3d !important;
}

body.mosaic-catalog-clean-v4 label[data-mosaic-checkbox-label="true"]:hover {
  background: rgba(7, 21, 47, .06) !important;
  border-radius: 4px;
}

body.mosaic-catalog-clean-v4 label[data-mosaic-checkbox-label="true"][data-mosaic-active="true"] {
  background: rgba(255, 45, 61, .10) !important;
  border-radius: 4px;
  font-weight: 900 !important;
}

/* Кнопки */
body.mosaic-catalog-clean-v4 form button:hover,
body.mosaic-catalog-clean-v4 form input[type="submit"]:hover,
body.mosaic-catalog-clean-v4 form a:hover {
  opacity: .95;
  transform: translateY(-1px);
}

body.mosaic-catalog-clean-v4 .mosaic-click-flash {
  transform: translateY(1px) scale(.995) !important;
}

/* Таблица */
body.mosaic-catalog-clean-v4 table tbody tr:hover {
  background: #fff7f8 !important;
  box-shadow: inset 4px 0 0 #ff2d3d !important;
}

body.mosaic-catalog-clean-v4 table a:hover,
body.mosaic-catalog-clean-v4 table button:hover {
  background: #07152f !important;
  color: #fff !important;
  border-color: #07152f !important;
}
`;

function installStyle() {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = css;
}

function textOf(el: Element | null) {
  return (el?.textContent || "").replace(/\s+/g, " ").trim();
}

function norm(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function hide(el: HTMLElement) {
  el.dataset.mosaicHide = "true";
  el.setAttribute("aria-hidden", "true");
}

function unhideAll() {
  document
    .querySelectorAll<HTMLElement>('[data-mosaic-hide="true"]')
    .forEach((el) => {
      delete el.dataset.mosaicHide;
      el.removeAttribute("aria-hidden");
    });
}

/**
 * Убираем левую вертикальную колонку полностью.
 * На скрине остались ВТ / СР / J, значит прежний список токенов был неполный.
 */
function hideLeftRail() {
  const tokens = new Set([
    "cs",
    "cn",
    "bc",
    "ev",
    "пп",
    "вт",
    "ср",
    "j",
    "jp",
    "jpn",
    "china",
    "100",
    "lhd",
  ]);

  const all = Array.from(document.querySelectorAll<HTMLElement>("body *"));

  for (const el of all) {
    if (el.dataset.mosaicHide === "true") continue;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;

    const text = norm(textOf(el));

    const isSingleLeftToken =
      tokens.has(text) &&
      rect.left >= 0 &&
      rect.left <= 70 &&
      rect.top >= 55 &&
      rect.top <= 360 &&
      rect.width <= 80 &&
      rect.height <= 40;

    if (isSingleLeftToken) {
      hide(el);
      continue;
    }

    const tokenScore = Array.from(tokens).filter((token) => {
      if (token.length === 1) return text === token || text.includes(` ${token} `);
      return text.includes(token);
    }).length;

    const isLeftRailContainer =
      tokenScore >= 3 &&
      rect.left >= 0 &&
      rect.left <= 85 &&
      rect.top >= 55 &&
      rect.top <= 360 &&
      rect.width <= 95 &&
      rect.height >= 60;

    if (isLeftRailContainer) {
      hide(el);
    }
  }

  /**
   * Дополнительный проход: если остались маленькие элементы в самой левой зоне
   * между шапкой и блоком результатов, скрываем их независимо от текста.
   * Это добивает декоративные остатки вертикального меню.
   */
  for (const el of all) {
    if (el.dataset.mosaicHide === "true") continue;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;

    const leftZoneGarbage =
      rect.left >= 0 &&
      rect.left <= 42 &&
      rect.top >= 60 &&
      rect.top <= 360 &&
      rect.width <= 42 &&
      rect.height <= 42 &&
      textOf(el).length <= 5;

    if (leftZoneGarbage) {
      hide(el);
    }
  }
}

/**
 * Убираем жёлтый баннер авторизации.
 */
function hideAuthBanner() {
  const all = Array.from(document.querySelectorAll<HTMLElement>("body *"));

  for (const el of all) {
    if (el.dataset.mosaicHide === "true") continue;

    const text = norm(textOf(el));

    if (!text.includes("войдите") || !text.includes("информацию по лоту")) {
      continue;
    }

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;

    let target: HTMLElement | null = el;

    for (let i = 0; i < 5 && target; i += 1) {
      const r = target.getBoundingClientRect();

      if (
        r.width >= window.innerWidth * 0.45 &&
        r.height <= 95 &&
        r.top >= 240 &&
        r.top <= 560
      ) {
        hide(target);
        break;
      }

      target = target.parentElement;
    }
  }
}

/**
 * Убираем List A / B / C / D / Статистика слева рядом с найдено.
 * Правую пагинацию со "стр." не трогаем.
 */
function hideModeButtons() {
  const badTexts = new Set([
    "list a",
    "list",
    "a",
    "b",
    "c",
    "d",
    "статистика",
  ]);

  const all = Array.from(
    document.querySelectorAll<HTMLElement>("a, button, span, div")
  );

  for (const el of all) {
    if (el.dataset.mosaicHide === "true") continue;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;

    const text = norm(textOf(el));

    if (text.includes("стр.")) continue;

    const isModeButton =
      badTexts.has(text) &&
      rect.left >= 80 &&
      rect.left <= 520 &&
      rect.top >= 280 &&
      rect.top <= 540 &&
      rect.width <= 150 &&
      rect.height <= 42;

    if (isModeButton) {
      hide(el);
    }
  }
}

function isActiveField(field: HTMLInputElement | HTMLSelectElement) {
  if (field instanceof HTMLInputElement) {
    if (field.type === "range") {
      return false;
    }

    if (field.type === "checkbox" || field.type === "radio") {
      return field.checked;
    }

    return Boolean(field.value.trim());
  }

  const value = field.value.trim();

  if (!value || value === "__any__") return false;

  const selectedText = norm(field.options[field.selectedIndex]?.text || "");
  if (selectedText === "любая" || selectedText === "выберите") return false;

  return true;
}

function markActiveFields() {
  const fields = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "form input, form select"
    )
  );

  for (const field of fields) {
    const active = isActiveField(field);

    field.dataset.mosaicFieldActive = active ? "true" : "false";

    const label = field.closest("label") as HTMLElement | null;

    if (label) {
      if (
        field instanceof HTMLInputElement &&
        (field.type === "checkbox" || field.type === "radio")
      ) {
        label.dataset.mosaicCheckboxLabel = "true";
      }

      label.dataset.mosaicActive = active ? "true" : "false";
    }
  }
}

function addClickReaction() {
  if (document.body.dataset.mosaicCatalogClickReactionV4 === "true") return;

  document.body.dataset.mosaicCatalogClickReactionV4 = "true";

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickable = target.closest(
        "form input, form select, form button, form a, form label, table tbody tr, table a, table button"
      ) as HTMLElement | null;

      if (!clickable) return;

      clickable.classList.add("mosaic-click-flash");

      window.setTimeout(() => {
        clickable.classList.remove("mosaic-click-flash");
        markActiveFields();
      }, 160);
    },
    true
  );

  document.addEventListener("input", () => window.setTimeout(markActiveFields, 40), true);
  document.addEventListener("change", () => window.setTimeout(markActiveFields, 40), true);
}

function applyCleanup() {
  installStyle();

  document.body.classList.add("mosaic-catalog-clean-v4");

  hideLeftRail();
  hideAuthBanner();
  hideModeButtons();
  markActiveFields();
  addClickReaction();
}

export default function CatalogUiCleaner() {
  const pathname = usePathname();

  useEffect(() => {
    const isCatalogList = pathname === "/catalog" || pathname === "/china";

    installStyle();

    if (!isCatalogList) {
      document.body.classList.remove("mosaic-catalog-clean-v4");
      unhideAll();
      return;
    }

    applyCleanup();

    const timers = [
      window.setTimeout(applyCleanup, 100),
      window.setTimeout(applyCleanup, 300),
      window.setTimeout(applyCleanup, 700),
      window.setTimeout(applyCleanup, 1400),
      window.setTimeout(applyCleanup, 3000),
    ];

    const observer = new MutationObserver(() => {
      window.setTimeout(applyCleanup, 80);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "checked", "selected", "value"],
    });

    return () => {
      timers.forEach(window.clearTimeout);
      observer.disconnect();
      document.body.classList.remove("mosaic-catalog-clean-v4");
      unhideAll();
    };
  }, [pathname]);

  return null;
}
