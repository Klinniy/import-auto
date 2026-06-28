import fs from "node:fs/promises";

const baseUrl = process.env.DEBUG_INTERNAL_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;

async function read(path) {
  try {
    return await fs.readFile(path, "utf8");
  } catch {
    return "";
  }
}

function has(text, pattern) {
  return text.includes(pattern);
}

function check(name, ok, level = "critical", details = "") {
  return { name, ok: Boolean(ok), level, details };
}

async function getJson(path) {
  const started = Date.now();

  try {
    const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    const json = await res.json();

    return {
      ok: res.ok && Boolean(json?.ok !== false),
      status: res.status,
      durationMs: Date.now() - started,
      path,
      total: json?.total ?? null,
      pages: json?.pages ?? null,
      itemsCount: Array.isArray(json?.items) ? json.items.length : null,
      scannedRows: json?.scannedRows ?? null,
      facets: json?.facets ? Object.fromEntries(
        Object.entries(json.facets).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.slice(0, 5) : value
        ])
      ) : null,
      error: json?.error || null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - started,
      path,
      error: String(error),
    };
  }
}

const files = {
  catalogPage: await read("app/catalog/page.tsx"),
  catalogUi: await read("components/CatalogFull.tsx"),
  catalogApi: await read("app/api/catalog/route.ts"),
  facetsApi: await read("app/api/catalog/facets/route.ts"),
  carApi: await read("app/api/car/[id]/route.ts"),
  detailPage: await read("app/catalog/[id]/page.tsx"),
};

const checks = [
  check("catalog-page-imports-catalog-full", has(files.catalogPage, "CatalogFull"), "critical", "Страница /catalog должна подключать основной компонент каталога."),
  check("catalog-api-exists", files.catalogApi.length > 1000, "critical", "Backend /api/catalog найден."),
  check("facets-api-exists", files.facetsApi.length > 1000, "critical", "Backend /api/catalog/facets найден."),
  check("catalog-ui-exists", files.catalogUi.length > 1000, "critical", "Frontend CatalogFull найден."),

  check("brand-model-required-search", has(files.catalogUi, "canSearch"), "critical", "Поиск должен запускаться только после явного выбора марки и модели/Любая."),
  check("any-value-supported", has(files.catalogUi, "ANY_VALUE"), "critical", "Должен быть явный вариант Любая."),
  check("dynamic-facets-fetch", has(files.catalogUi, "/api/catalog/facets"), "critical", "Фильтры должны обновляться от текущей выдачи."),
  check("common-filter-reset", has(files.catalogUi, "resetOnlyFilters"), "important", "Нужен общий сброс правого блока фильтров."),
  check("selected-filter-toggle", has(files.catalogUi, "selected ? active : item.value"), "important", "Повторный клик по выбранному фильтру должен снимать фильтр."),
  check("active-filter-sticky", has(files.catalogUi, "normalizedItems"), "important", "Выбранный фильтр не должен пропадать после пересчета фасетов."),

  check("year-range-options", has(files.catalogUi, "yearFromOptions") && has(files.catalogUi, "yearToOptions"), "important", "Год от/до должен запрещать невозможный диапазон."),
  check("year-range-autofix", has(files.catalogUi, "AUTO FIX YEAR RANGE"), "important", "Если диапазон годов стал невозможным, UI должен исправлять его."),

  check("facets-scan-chunks", has(files.facetsApi, "chunkSize") && has(files.facetsApi, "maxRows"), "important", "Фасеты должны считаться не по первым 500 строкам, а пачками."),
  check("facets-color-normalization", has(files.facetsApi, "normalizeFacet") && has(files.facetsApi, "черный"), "important", "Цвета должны объединяться: black/BLACK/Black."),
  check("catalog-color-search-variants", has(files.catalogApi, "colorVariants"), "important", "Выбор цвета должен искать все варианты написания."),
  check("status-normalization", has(files.facetsApi, "normalizeStatusValue") || has(files.catalogApi, "normalizeStatusValue"), "important", "Статусы должны маппиться sold/not_sold/removed/cancelled."),
  check("body-hover-preview", has(files.catalogUi, "sampleImage") && has(files.facetsApi, "firstPreviewImage"), "optional", "При наведении на кузов должен показываться пример авто."),

  check("pagination-exists", has(files.catalogUi, "AfaPager"), "important", "Пагинация должна быть на странице."),
  check("lot-open-link", has(files.catalogUi, "/catalog/${car.id}") || has(files.catalogUi, "/catalog/"), "critical", "Лот должен открываться в детальную страницу."),
  check("detail-page-exists", files.detailPage.length > 500 || files.carApi.length > 500, "important", "Детальная страница/endpoint лота должны существовать."),
];

const liveTests = {
  catalogNissan: await getJson("/api/catalog?brand=NISSAN&page=1&limit=5"),
  catalogMazdaYears: await getJson("/api/catalog?brand=MAZDA&yearFrom=2024&yearTo=2026&page=1&limit=5"),
  facetsNissan: await getJson("/api/catalog/facets?brand=NISSAN"),
  facetsMazdaAny: await getJson("/api/catalog/facets?brand=MAZDA"),
};

const missingLogic = [];

if (!has(files.catalogUi, "priceFrom") && !has(files.catalogUi, "priceTo")) {
  missingLogic.push({
    area: "Фильтры цены",
    priority: "medium",
    issue: "В UI каталога нет полноценного фильтра цены от/до.",
    recommendation: "Добавить поля Цена от / Цена до после стабилизации базового каталога."
  });
}

if (!has(files.catalogUi, "volumeFrom") && !has(files.catalogUi, "volumeTo")) {
  missingLogic.push({
    area: "Фильтр объёма двигателя",
    priority: "medium",
    issue: "В UI нет рабочего диапазона объёма двигателя от/до.",
    recommendation: "Добавить после цены, так как backend уже близко к поддержке числовых диапазонов."
  });
}

if (!has(files.catalogUi, "debounce") && has(files.catalogUi, "/api/catalog/facets")) {
  missingLogic.push({
    area: "Производительность",
    priority: "high",
    issue: "Фасеты пересчитываются при каждом изменении фильтра без debounce/cache на frontend.",
    recommendation: "Добавить небольшую задержку 250–400 мс или серверный cache key для фасетов."
  });
}

if (!has(files.catalogUi, "pageNumbers") && !has(files.catalogUi, "goToPage")) {
  missingLogic.push({
    area: "Пагинация",
    priority: "low",
    issue: "Сейчас есть только стрелки назад/вперед, нет быстрого перехода на страницу.",
    recommendation: "Добавить поле ввода страницы или короткий список страниц."
  });
}

if (!has(files.catalogUi, "sort") || !has(files.catalogApi, "orderSql")) {
  missingLogic.push({
    area: "Сортировка",
    priority: "medium",
    issue: "Нужно проверить, полностью ли сортировка подключена к UI и backend.",
    recommendation: "Добавить понятные сортировки: дата, год, пробег, цена."
  });
}

if (!has(files.catalogUi, "loading") || !has(files.catalogUi, "Загружаем")) {
  missingLogic.push({
    area: "UX загрузки",
    priority: "low",
    issue: "Нужно убедиться, что при смене фильтров виден статус загрузки.",
    recommendation: "Оставить компактный текст загрузки или небольшой индикатор."
  });
}

const failedChecks = checks.filter((item) => !item.ok);
const criticalFailed = failedChecks.filter((item) => item.level === "critical");
const importantFailed = failedChecks.filter((item) => item.level === "important");

const liveOk = Object.values(liveTests).every((test) => test.ok);

const result = {
  ok: criticalFailed.length === 0 && liveOk,
  checkedAt: new Date().toISOString(),
  baseUrl,
  summary: {
    status:
      criticalFailed.length > 0
        ? "critical_issues"
        : importantFailed.length > 0
          ? "works_with_warnings"
          : "good",
    checksTotal: checks.length,
    checksPassed: checks.filter((item) => item.ok).length,
    checksFailed: failedChecks.length,
    liveTestsOk: liveOk,
    recommendation:
      criticalFailed.length > 0
        ? "Сначала исправить критические ошибки."
        : "Каталог можно считать рабочей базой. Перед следующим этапом стоит закрыть пункты high/medium из missingLogic."
  },
  checks,
  failedChecks,
  liveTests,
  missingLogic,
  nextStageReadiness: {
    canMoveNext: criticalFailed.length === 0 && liveOk,
    suggestedNextStage: "Детальная страница лота в том же AFA-стиле + блок заявки/расчёта стоимости.",
    beforeNextStageRecommended: [
      "Проверить визуально body hover preview.",
      "Проверить год от/до.",
      "Проверить повторный клик по выбранному статусу/цвету.",
      "Добавить debounce/cache фасетов, если фильтры начнут тормозить."
    ]
  }
};

await fs.writeFile("public/catalog-audit.json", JSON.stringify(result, null, 2), "utf8");

console.log(JSON.stringify({
  ok: result.ok,
  status: result.summary.status,
  checksPassed: result.summary.checksPassed,
  checksTotal: result.summary.checksTotal,
  checksFailed: result.summary.checksFailed,
  liveTestsOk: result.summary.liveTestsOk,
  missingLogicCount: result.missingLogic.length,
  output: "/catalog-audit.json"
}, null, 2));
