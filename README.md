# tubebook

Монорепозиторий для приложения обработки YouTube-видео.

## Приложения (Apps)

* `apps/api` — NestJS API (`/api/*`), PostgreSQL (Kysely), воркеры очереди BullMQ ([README](apps/api/README.md))
* `apps/web` — фронтенд на Next.js ([README](apps/web/README.md))
* `apps/mastra` — AI-сервис Mastra

## Пакеты (Packages)

* `packages/schemas` — общие Zod-схемы для доменной модели и API ([README](packages/schemas/README.md))
