# @tubebook/schemas

Общие контракты на Zod.

## Структура

Схемы разделены по модулям и назначению:

* `domain.ts` — схемы и типы внутренней доменной модели
* `api.input.ts` — схемы и типы для запросов/входных данных
* `api.output.ts` — схемы и типы для ответов/выходных данных

Публичный корневой barrel `src/index.ts` генерируется автоматически с помощью `barrelsby`.

## Использование

Импортируйте из корня пакета:

```ts
import { createVideoRequestSchema, videoSchema } from "@tubebook/schemas"
```

По возможности держите доменные модели независимыми от транспортно-специфичных полей.

## Скрипты

* `pnpm --filter @tubebook/schemas run barrels` — пересобрать `src/index.ts`
* `pnpm --filter @tubebook/schemas run build` — пересобрать barrel и собрать CJS/ESM через `tsup`
