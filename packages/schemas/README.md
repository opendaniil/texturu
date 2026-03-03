# @texturu/schemas

Общие контракты на Zod.

## Структура

Схемы разделены по модулям и назначению:

* `domain.ts` — схемы и типы внутренней доменной модели
* `api.ts` — API-представление доменной сущности (транспортный слой)
* `api.input.ts` — схемы и типы для запросов/входных данных
* `api.output.ts` — схемы и типы для ответов/выходных данных

Публичный корневой barrel `src/index.ts` генерируется автоматически с помощью `barrelsby`.

## Скрипты

* `pnpm --filter @texturu/schemas run barrels` — пересобрать `src/index.ts`
* `pnpm --filter @texturu/schemas run build` — пересобрать barrel и собрать CJS/ESM через `tsup`
