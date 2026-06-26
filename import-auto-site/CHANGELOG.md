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
