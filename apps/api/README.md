# api

> Модульный монолит на NestJS. Один деплой, жёсткие границы между модулями.  
> Код, противоречащий этому документу, — техдолг.

---

## Структура

```

src/
├── infra/                        # database, queue, auth, config
├── modules/<module>/
│   ├── entrypoint/               # controller, workers, dto
│   ├── application/              # service (+ use-cases, если сложно)
│   ├── data/                     # repo (SQL/Kysely)
│   ├── contracts/                # (опц.) queue job names + payloads (если межмодульно)
│   ├── <module>.module.ts
│   └── index.ts                  # публичный API: Module + contracts (barrel, без export *)
└── main.ts

```

Папки внутри слоя появляются по мере роста, не заранее.  
Один сервис с несколькими методами лучше россыпи мелких use-case файлов без необходимости.

---

## Зависимости

- `modules -> infra` ✅
- `infra -> modules` ❌
- прямые импорты файлов из другого модуля ❌

Разрешённая межмодульная связь:
- **Sync:** `imports: [OtherModule]` + DI только того, что в `exports`
- **Async:** BullMQ + `contracts/`

Разрешён импорт только через `modules/<other>/index.ts`.

---

## Слои внутри модуля

`entrypoint -> application -> data`

- **entrypoint** — HTTP/queue I/O, валидация, dto, маппинг. Не вызывает repo, без бизнес-логики.
- **application** — бизнес-правила и оркестрация. Единственный слой, который зовёт repo/очереди/клиентов.
- **data** — SQL (Kysely). Без бизнес-логики. Получает `trx` аргументом, не создаёт транзакции.

Если application-сервис перерастает ~300 строк или теряется читаемость/ответственность — выделяй use-case. Не раньше.

---

## Публичный API модуля

`modules/<module>/index.ts` экспортирует только:
- `<Module>` всегда
- application-сервис (для DI-токена потребителями, если нужно)
- `contracts/*` (если межмодульно)

`repo`, схемы, внутренние сервисы — не экспортируются.
`index.ts` внутри подпапок модуля не создаются.

---

## Интеграция между модулями

1) **Sync** — `imports: [OtherModule]` → DI только того, что в `exports`.  
2) **Async** — BullMQ job → worker другого модуля. Контракт в `contracts/` модуля-владельца.

Если producer и worker внутри одного модуля — `contracts/` не нужен, типы лежат рядом с worker.

Прямой импорт файлов из чужого модуля (`../other/...`) — запрещён.

---

## БД и транзакции

- SQL — только в `data/*.repo.ts`.
- Одна запись — обычный метод repo.
- Несколько записей/таблиц — `UnitOfWork`. Repo получает `trx`, не создаёт сам.
- Модуль **пишет** только в свои таблицы. Чтение (в т.ч. join) допускается.

---

## Async

- Долгая или retry-операция → BullMQ job.
- Worker = entrypoint. Вызывает `application`, не `data`.

---

## Куда класть код

| Что                  | Куда                                   |
|----------------------|----------------------------------------|
| REST-эндпоинт        | `entrypoint/`                          |
| бизнес-операция      | `application/<module>.service.ts`      |
| сложная оркестрация  | `application/use-cases/*` (когда дорос)|
| SQL-запрос           | `data/`                                |
| фоновый процесс      | `entrypoint/workers/` → `application/` |
| общая утилита        | `infra/`                               |
| межмодульная связь   | `exports` или `contracts/` + BullMQ    |

---

## Принцип роста

Начинай с минимума: один сервис, плоские папки.  
Декомпозируй, когда больно, не когда «правильно».

```

// сейчас
application/
    video.service.ts

// потом (когда service вырос)
application/
    video.service.ts   # фасад: делегирует
    use-cases/
        create-video.use-case.ts
        generate-article.use-case.ts

```
