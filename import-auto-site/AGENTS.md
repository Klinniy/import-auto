<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project rules for MosaicAuto / Import Auto

- Общайтесь с владельцем проекта на русском языке.
- Выполняйте команды из каталога `import-auto-site`.
- Для установки зависимостей используйте `npm ci`.
- Для изменений кода проверяйте `npm run build`.
- Одна задача — одно логически цельное изменение.
- Не выполняйте `push`, `merge` и deployment без явного разрешения.
- Не подключайтесь к production-серверу.
- Не изменяйте production `.env` и базу данных.
- Не читайте и не выводите секреты.
- Внешние API вызывайте только серверным кодом.
- Не принимайте произвольный SQL от пользователя.
- Не возвращайте авторизацию, личный кабинет, избранное, блоки «Получить расчёт» и «Комментарии / примечания» без отдельного запроса.
- Сохраняйте маршруты Японии, Китая, Кореи, калькуляторов и статистики.
- В итоговом отчёте перечисляйте изменения, файлы, проверки, ручную проверку, env, миграции и действия на сервере.
