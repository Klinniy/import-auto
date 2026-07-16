# Аудит японского калькулятора MosaicAuto

## Подтверждённый формат ответа Calcos

Живой аудит Calcos показал, что курсы валют приходят не отдельными XML-тегами `<usd>`, `<eur>`, `<jpy>`, а строкой внутри `<currency>`:

```xml
<currency>USDRUB_system:76.6213;EURRUB_system:87.5781;JPYRUB_system:0.472679;...</currency>
```

Значения означают:

- `USDRUB_system` — рублей за 1 USD;
- `EURRUB_system` — рублей за 1 EUR;
- `JPYRUB_system` — рублей за 1 JPY.

## Точная формула `<sum>`

Во всех 12 проверенных живых сценариях итоговый тег `<sum>` точно восстанавливался по строкам ответа:

```text
apiSumRub = sum(tag1) * JPYRUB_system
  + sum(tag2) * USDRUB_system
  + sum(tag3)
```

Семантика строк, подтверждённая наблюдаемой структурой:

- `tag1` — JPY-компоненты: первым значением идёт стоимость автомобиля, последующие значения — расходы поставщика в Японии;
- `tag2` — USD-компонент таможенного платежа `fiz` или `jur`;
- `tag3` — RUB-компоненты поставщика в России.

Контрольный допуск для route-equivalent пересчёта — не более 2 рублей из-за округления.

## Исправление production route

Production route `/api/calculator/japan` теперь:

1. Разбирает `<currency>` и берёт курсы по приоритету: Calcos → ЦБ РФ → fallback.
2. Разбирает строки по отдельным блокам `<row>` в исходном порядке и state-machine выделяет только начальный денежный блок: начальные `tag1`, затем `tag2`, затем `tag3`; повторный `tag1` после `tag2/tag3` считается началом служебного echo входных параметров и исключается из суммы.
3. Проверяет структуру денежного блока: первое денежное `tag1` должно совпадать с ценой из запроса, а сумма денежных `tag2` — с `fiz` или `jur` для текущего режима.
4. Использует `<sum>` Calcos как авторитетный итог для physical и juridical.
5. Независимо пересчитывает сумму по формуле `sum(tag1) * jpyRub + sum(tag2) * usdRub + sum(tag3)`.
6. Возвращает контролируемую ошибку, если расхождение с `<sum>` больше 2 рублей или денежный блок имеет непонятную структуру.
7. Не добавляет `CALCOS_JAPAN_*` расходы поверх строк Calcos.
8. Использует `CALCOS_JAPAN_*` только как fallback при полном отсутствии строк `row/tag*` в ответе API и помечает такой результат как fallback.
9. Не возвращает в браузер `rawXml` и не раскрывает `CALCOS_DUTY_API_URL`.

Диагностические поля клиентского JSON без секретов:

- `apiSumRub`;
- `reconstructedSumRub`;
- `reconstructionDiffRub`;
- `currencySource`;
- `calculationSource: "calcos"`;
- `usedFallback`.

## Старая причина завышения

До исправления route:

1. Искал несуществующие legacy-теги `<usd>`, `<eur>`, `<jpy>`.
2. Из-за отсутствия `<usd>` использовал fallback USD/RUB `88` вместо курса Calcos.
3. Дополнительно добавлял поверх ответа Calcos собственные компоненты:
   - `CALCOS_JAPAN_SHEET1`;
   - `CALCOS_JAPAN_FREIGHT_USD`;
   - `CALCOS_JAPAN_STORAGE_RUB`;
   - `CALCOS_JAPAN_BROKER_RUB`;
   - `CALCOS_JAPAN_GLONASS_RUB`.
4. Эти компоненты не соответствовали строкам `tag1/tag2/tag3` и приводили к двойному или альтернативному учёту расходов.

Итог сайта из-за этого мог превышать реальный `<sum>` Calcos на 2–12%.

## Автоматические проверки

```bash
npm run test:audit:calculator:japan
npm run test:route:calculator:japan
npm run build
```

Покрытые сценарии:

- разбор `<currency>`;
- разбор нескольких `tag1/tag2/tag3` только из начального денежного блока;
- игнорирование служебных echo-строк `year`, `passing`, `power`, `volume`, `fuel`, `tax_mode` после денежного блока;
- regression первого живого сценария с расхождением 3947 JPY echo-строк;
- восстановление `<sum>` по подтверждённой формуле;
- physical с `fiz_info`;
- juridical с `jur_info`;
- обнаружение расхождения больше 2 рублей;
- отсутствие двойного добавления `CALCOS_JAPAN_*` при наличии строк Calcos;
- fallback при отсутствии `row/tag*`;
- отсутствие секретов и `rawXml` в клиентском диагностическом payload.

## План staging-проверки

На staging после деплоя ветки выполнить:

```bash
cd import-auto-site
npm ci
npm run build
npm run test:audit:calculator:japan
npm run test:route:calculator:japan
CALCOS_DUTY_API_URL='<staging-calcos-url>' npm run audit:calculator:japan
```

Критерии успешной проверки:

1. 12 живых сценариев проходят без HTTP-ошибок Calcos.
2. В каждом ответе распознан `<currency>` с `USDRUB_system`, `EURRUB_system`, `JPYRUB_system`.
3. `routeEquivalentTotalRub` равен `<sum>` Calcos.
4. `reconstructionDiffRub <= 2` для каждого режима physical/juridical, включая ответы, где после денежного блока Calcos повторяет входные параметры автомобиля в `tag1`.
5. В браузерном ответе нет `rawXml`, полного URL Calcos или секретных query-параметров.
6. Если Calcos вернёт ответ без строк `row/tag*`, результат явно помечается `usedFallback: true`.
