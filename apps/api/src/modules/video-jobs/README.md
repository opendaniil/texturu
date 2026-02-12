# Video Jobs Module

Отвечает за асинхронный пайплайн обработки видео.

BullMQ - единственный source of truth для исполнения job.
База данных хранит только бизнес-сущности (`videos`, `video_captions`) и их статусы.

## Как добавить новый тип job

1. Добавить payload-тип в `video-jobs.service.ts`.
2. Добавить enqueue-метод в `VideoJobsService` с детерминированным `jobId`.
3. Реализовать worker:
   - `@Processor(QUEUE_NAME)`,
   - работа через `job.data`,
   - `throw` на ошибках для нативного BullMQ retry,
   - `@OnWorkerEvent("failed")` для обработки финального фейла.
4. Зарегистрировать queue и provider в `video-jobs.module.ts`.

## Фичи

- Двухшаговый pipeline: `fetch_captions -> generate_article`.
- Детерминированные `jobId` (`fetch:${videoId}` и `generate:${videoId}`).
- Retry/backoff на уровне BullMQ.
- Синхронизация статуса видео (`queued/processing/done/error`) с ходом джоб.
- Ограничение накопления BullMQ-задач (`removeOnComplete/removeOnFail`).

## Ключевые файлы

- `video-jobs.service.ts` - API для постановки задач в BullMQ.
- `fetch-captions.worker.ts` - воркер скачивания/парсинга субтитров.
- `generate-article.worker.ts` - воркер генерации статьи.
