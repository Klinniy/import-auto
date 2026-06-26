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
