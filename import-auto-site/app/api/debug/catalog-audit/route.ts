import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function read(path: string) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return "";
  }
}

function has(text: string, pattern: string) {
  return text.includes(pattern);
}

function check(name: string, ok: boolean, level: "critical" | "important" | "optional", details: string) {
  return { name, ok, level, details };
}

export async function GET() {
  const files = {
    catalogPage: await read("app/catalog/page.tsx"),
    catalogUi: await read("components/CatalogFull.tsx"),
    catalogApi: await read("app/api/catalog/route.ts"),
    facetsApi: await read("app/api/catalog/facets/route.ts"),
    carApi: await read("app/api/car/[id]/route.ts"),
    detailPage: await read("app/catalog/[id]/page.tsx"),
  };

  const checks = [
    check("catalog-page-imports-catalog-full", has(files.catalogPage, "CatalogFull"), "critical", "/catalog должен подключать CatalogFull."),
    check("catalog-api-exists", files.catalogApi.length > 1000, "critical", "/api/catalog найден."),
    check("facets-api-exists", files.facetsApi.length > 1000, "critical", "/api/catalog/facets найден."),
    check("catalog-ui-exists", files.catalogUi.length > 1000, "critical", "components/CatalogFull.tsx найден."),

    check("brand-model-required-search", has(files.catalogUi, "canSearch"), "important", "Поиск должен запускаться только после явного выбора марки и модели/Любая."),
    check("any-value-supported", has(files.catalogUi, "ANY_VALUE"), "important", "Есть явный вариант Любая."),
    check("dynamic-facets-fetch", has(files.catalogUi, "/api/catalog/facets"), "critical", "Фасеты подключены к текущей выдаче."),
    check("common-filter-reset", has(files.catalogUi, "resetOnlyFilters"), "important", "Есть общий сброс правого блока фильтров."),
    check("selected-filter-toggle", has(files.catalogUi, "selected ? active : item.value"), "important", "Повторный клик по выбранному фильтру должен снимать его."),
    check("active-filter-sticky", has(files.catalogUi, "normalizedItems"), "important", "Выбранный фильтр не должен пропадать после пересчета фасетов."),

    check("year-range-options", has(files.catalogUi, "yearFromOptions") && has(files.catalogUi, "yearToOptions"), "important", "Год от/до должен запрещать невозможный диапазон."),
    check("year-range-autofix", has(files.catalogUi, "AUTO FIX YEAR RANGE"), "important", "Нереальный диапазон годов должен исправляться автоматически."),

    check("facets-scan-chunks", has(files.facetsApi, "chunkSize") && has(files.facetsApi, "maxRows"), "important", "Фасеты считаются пачками, а не только по первым 500 строкам."),
    check("facets-color-normalization", has(files.facetsApi, "normalizeFacet") && has(files.facetsApi, "черный"), "important", "Цвета black/BLACK/Black объединяются."),
    check("catalog-color-search-variants", has(files.catalogApi, "colorVariants"), "important", "Выбор цвета ищет разные варианты написания."),
    check("status-normalization", has(files.catalogApi, "normalizeStatusValue") || has(files.facetsApi, "normalizeStatusValue"), "important", "Статусы маппятся в реальные значения API."),
    check("body-hover-preview", has(files.catalogUi, "sampleImage") && has(files.facetsApi, "firstPreviewImage"), "optional", "Наведение на кузов показывает пример авто."),

    check("pagination-exists", has(files.catalogUi, "AfaPager"), "important", "Пагинация есть."),
    check("lot-open-link", has(files.catalogUi, "/catalog/${car.id}"), "critical", "Лот открывается в детальную страницу."),
    check("detail-page-exists", files.detailPage.length > 500 || files.carApi.length > 500, "important", "Детальная страница/endpoint лота существуют."),
  ];

  const missingLogic = [];

  if (!has(files.catalogUi, "priceFrom") && !has(files.catalogUi, "priceTo")) {
    missingLogic.push({
      area: "Цена",
      priority: "medium",
      issue: "В каталоге нет фильтра цены от/до.",
      recommendation: "Добавить после стабилизации текущих фасетов."
    });
  }

  if (!has(files.catalogUi, "volumeFrom") && !has(files.catalogUi, "volumeTo")) {
    missingLogic.push({
      area: "Объем двигателя",
      priority: "medium",
      issue: "Нет фильтра объема двигателя от/до.",
      recommendation: "Добавить рядом с годом и пробегом."
    });
  }

  if (!has(files.catalogUi, "debounce") && has(files.catalogUi, "/api/catalog/facets")) {
    missingLogic.push({
      area: "Производительность фасетов",
      priority: "high",
      issue: "Фасеты пересчитываются сразу при каждом изменении фильтра.",
      recommendation: "Добавить debounce 300–500 мс или cache для одинаковых запросов."
    });
  }

  if (!has(files.catalogUi, "goToPage") && !has(files.catalogUi, "pageNumbers")) {
    missingLogic.push({
      area: "Пагинация",
      priority: "low",
      issue: "Есть только вперед/назад, нет быстрого перехода на страницу.",
      recommendation: "Добавить поле ввода номера страницы."
    });
  }

  if (!has(files.catalogUi, "Сброс фильтров")) {
    missingLogic.push({
      area: "Сброс фильтров",
      priority: "medium",
      issue: "Не найден общий сброс фильтров.",
      recommendation: "Вернуть кнопку общего сброса правого блока."
    });
  }

  const failedChecks = checks.filter((item) => !item.ok);
  const criticalFailed = failedChecks.filter((item) => item.level === "critical");
  const importantFailed = failedChecks.filter((item) => item.level === "important");

  return NextResponse.json({
    ok: criticalFailed.length === 0,
    version: "CATALOG AUDIT FAST V1",
    checkedAt: new Date().toISOString(),
    summary: {
      status: criticalFailed.length > 0 ? "critical_issues" : importantFailed.length > 0 ? "works_with_warnings" : "good",
      checksTotal: checks.length,
      checksPassed: checks.filter((item) => item.ok).length,
      checksFailed: failedChecks.length,
      criticalFailed: criticalFailed.length,
      importantFailed: importantFailed.length,
    },
    failedChecks,
    checks,
    missingLogic,
    nextStageReadiness: {
      canMoveNext: criticalFailed.length === 0,
      suggestedNextStage: "Детальная страница лота в AFA-стиле + блок заявки/расчета стоимости.",
      beforeNextStageRecommended: [
        "Проверить визуально наведение на кузов.",
        "Проверить год от/до.",
        "Проверить повторный клик по выбранному статусу/цвету.",
        "Добавить debounce фасетов, если фильтры будут тормозить."
      ]
    }
  });
}
