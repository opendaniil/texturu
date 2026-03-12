# texturu

## [textu.ru](https://textu.ru/) — fullstack приложение, который по ссылке на YouTube видео формирует структурированный конспект и помогает быстрее получать суть длинных роликов.

## Зачем
Проект решает простую задачу: вместо просмотра длинного видео пользователь получает краткую и структурированную выжимку содержания.

## Возможности
- обработка YouTube видео по ссылке с запуском пайплайна анализа контента
- генерация структурированной статьи вместо простого краткого пересказа
- чат с LLM по обработанному материалу
- RAG для ответов на основе конкретного содержания видео
- инструмент LLM работать с отдельными секциями статьи

## Стек
- Frontend: Next.js, TypeScript
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- Queues: BullMQ
- Shared contracts: Zod
- Architecture: Monorepo (pnpm workspace)

## Архитектура
- `apps/web` — клиентское приложение на Next.js
- `apps/api` — API на NestJS, работа с PostgreSQL, фоновые воркеры
- `apps/mastra` — AI-сервис
- `packages/schemas` — общие схемы и контракты

## Локальный запуск
### Требования
- Node.js
- pnpm
- Docker

### Установка
```bash
pnpm install
cp .env.example .env
````

### Запуск

```bash
pnpm dev
```
