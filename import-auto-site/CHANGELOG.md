# Import Auto — Changelog

## v0.2.0 — Debug Center

Дата: 2026-06-26

Добавлено:
- Новый Debug Center: /debug
- Диагностика API: /api/debug
- Summary endpoint: /summary.json
- Debug Run endpoint: /api/debug/run
- Проверка brands
- Проверка models
- Проверка catalog
- Проверка currency
- Проверка images
- Проверка catalog-flow
- Кнопка Copy JSON
- Исправлена нормализация AJES env-переменных
- Исправлена работа AJES client с AJ_API_CODE / AJ_CODE / AVTOJP_API_KEY
- Исправлена нормализация фото:
  - original без размеров
  - preview с &h=50
  - medium с &w=320
  - устранены битые URL вида &h=50?h=50 и &h=50?w=320

Статус:
- Debug Center работает
- API работает
- Brands работает
- Models работает
- Catalog работает
- Filters работают
- Images работают
- Catalog Flow verdict: OK

## v0.3.0 — Catalog Service Layer

Дата: 2026-06-26

Добавлено:
- Вынесена логика каталога из `app/api/catalog/route.ts`.
- Добавлен `lib/catalog/filters.ts`.
- Добавлен `lib/catalog/repository.ts`.
- Добавлен `lib/catalog/service.ts`.
- `/api/catalog` теперь работает через CatalogService.
- Добавлен debug-режим каталога: `/api/catalog?debug=1&page=1&limit=3`.

Статус:
- Архитектура каталога разделена на route → service → repository → mapper.
- Поведение API каталога сохранено.

## v0.3.1 — Catalog Performance Diagnostics

Дата: 2026-06-26

Добавлено:
- В `CatalogRepository` добавлены тайминги `countMs`, `itemsMs`, `totalMs`.
- `/api/catalog` теперь возвращает `meta` с длительностью выполнения.
- `/api/catalog?debug=1` возвращает SQL и meta-диагностику.
- В Debug Center добавлена проверка `Catalog Debug`.
- В `Catalog Flow` добавлены проверки `catalogMetaOk` и `catalogDebugOk`.

Статус:
- Каталог сохраняет прежнее поведение.
- Производительность и SQL теперь удобно проверяются через `/debug`.

## v0.3.2 — Catalog Image Service

Дата: 2026-06-26

Добавлено:
- Вынесена логика изображений из `lib/catalog/mapper.ts`.
- Добавлен `lib/catalog/images.ts`.
- Добавлены функции:
  - `stripImageSize`
  - `withAjesImageSize`
  - `normalizeCatalogImage`
  - `parseImages`
  - `getPreviewImage`
  - `validateImageSet`
- `mapper.ts` теперь отвечает только за преобразование строки AJES в `CatalogCar`.
- В `Catalog Flow` добавлена проверка `imageServiceOk`.

Статус:
- Архитектура каталога теперь ближе к схеме route → service → repository → mapper → image service.
- Поведение API каталога сохранено.

## v0.3.3 — Catalog Dictionary Service

Дата: 2026-06-26

Добавлено:
- Вынесена логика марок и моделей в `lib/catalog/dictionaries.ts`.
- `/api/brands` теперь работает через Dictionary Service.
- `/api/models` теперь работает через Dictionary Service.
- Добавлен debug-режим:
  - `/api/brands?debug=1`
  - `/api/models?brand=TOYOTA&debug=1`
- В Debug Center добавлена проверка `Dictionaries`.
- В `/api/debug/run?test=all` добавлена проверка dictionaries.

Статус:
- Архитектура справочников приведена к общей схеме.
- Brands / Models проверяются через Debug Center.

## v0.3.4 — Fix AJES Dictionary SQL

Дата: 2026-06-26

Исправлено:
- Dictionary Service больше не использует SQL alias `as id`, `as name`, `as count`, потому что AJES возвращал `unknown field`.
- Для `/api/brands` восстановлена рабочая схема:
  - `select marka_id,marka_name,count(*) from main group by marka_id order by marka_name asc`
  - mapping: `MARKA_ID`, `MARKA_NAME`, `TAG2`
- Для `/api/models` восстановлена рабочая схема:
  - `select model_id,model_name,count(*) from main ... group by model_id order by model_name asc`
  - mapping: `MODEL_ID`, `MODEL_NAME`, `TAG2`
- `/api/models` без brand теперь возвращает общий список моделей для Debug Center.

Статус:
- Нужно проверить через Debug Center:
  - Dictionaries
  - Catalog Flow

## v0.3.5 — Catalog Filter Options Service

Дата: 2026-06-26

Добавлено:
- Новый сервис `lib/catalog/filter-options.ts`.
- Новый endpoint `/api/filters`.
- Debug-режим `/api/filters?debug=1`.
- В фильтры добавлены группы:
  - brands
  - years
  - auctions
  - transmissions
  - drives
  - rates
  - colors
- В Debug Center добавлена кнопка `Filters`.
- В `/api/debug/run?test=all` добавлена проверка filters.

Статус:
- Каталог, справочники и фильтры теперь разделены на отдельные сервисы.

## v0.4.1 — Live Catalog Preview

Дата: 2026-06-26

Изменено:
- `components/CatalogPreview.tsx` больше не показывает заглушку.
- На главной странице блок каталога теперь загружает реальные авто из `/api/catalog?page=1&limit=3`.
- Добавлены реальные фото, марка, модель, год, лот, пробег, объем двигателя и оценка.
- Существующая главная страница и полный каталог не перезаписывались.

Статус:
- Начали точечную доработку текущего сайта без удаления существующей структуры.
