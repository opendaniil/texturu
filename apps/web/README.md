# web

> Frontend на Next.js (App Router) + Feature-Sliced Design 2.1 (Pages First).
> Максимум кода живёт рядом с местом использования: **pages/widgets владеют UI, моделью и API**, Shared — только для реально общего.
> Код, противоречащий этому документу, — техдолг.

---

## Структура

Проект использует Next.js `app/` для роутинга. Архитектурные слои FSD живут в `src/`.

```
app/                               # Next.js route entrypoints (тонкие обёртки)
  page.tsx
  layout.tsx
  article/[slug]/
    page.tsx
    layout.tsx
    loading.tsx
    error.tsx
  status/[slug]/page.tsx

src/
  app/                             # глобальный запуск приложения
    providers.tsx
    globals.css

  pages/                           # страницы (pages first)
    <page>/
      ui/                          # UI страницы (секции, формы, блоки)
      model/                       # state/бизнес-логика страницы
      api/                         # запросы/адаптеры (если нужны только тут)
      lib/                         # локальные утилиты страницы (не общие)
      index.ts                     # публичный API страницы (без export *)

  widgets/                         # (опц.) большие автономные блоки/сценарии
    <widget>/
      ui/
      model/
      api/
      index.ts                     # публичный API виджета (без export *)

  shared/                          # переиспользуемое > 1 раза + инфраструктура
    ui/                            # дизайн-система/примитивы
    api/                           # общий клиент, общие типы запросов/DTO
    lib/                           # утилиты, хелперы, общие типы предметной области
    config/                        # конфиги/флаги
```

Папки внутри срезов появляются по мере роста, не заранее.
Один нормальный компонент/хук лучше россыпи микрофайлов без необходимости.

---

## Pages first (главное правило)

* Если код используется **только на одной странице** (крупные UI-блоки, формы, логика данных) — он остаётся **в `src/pages/<page>/...`**.
* Если код нужен **больше чем в одном месте** (страница/виджет) — он идёт в **`src/shared`**.
* Виджет хранит **свой** store/бизнес-логику/API, пока это не нужно снаружи.

**Критерий Shared простой:** *используется > 1 раза* → Shared.

---

## Роутинг в Next.js (App Router)

`app/` содержит **только route entrypoints**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` и Next-специфичные экспорты (`generateMetadata`, `generateStaticParams` и т.п.).

Каждый entrypoint — **тонкая обёртка**, которая импортирует реальный UI/логику из `src/pages/` или `src/widgets/`.

```tsx
// app/article/[slug]/page.tsx — тонкий entrypoint
import { ArticlePage } from '@/pages/article'

export default function Page({ params }: { params: { slug: string } }) {
  return <ArticlePage slug={params.slug} />
}

export { generateMetadata } from '@/pages/article'
```

```tsx
// app/article/layout.tsx — тонкий entrypoint
import { ArticleLayout } from '@/pages/article'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ArticleLayout>{children}</ArticleLayout>
}
```

Вся логика, данные и композиция живут в `src/pages/<page>/*` (или `src/widgets/*`).
Сложный layout допустим, но его «мясо» должно быть вынесено из `app/`.

> **Два `app`:** `app/` (корень) — роутинг Next.js. `src/app/` — глобальная инициализация (providers, стили). Не путать.

---

## Server Components и Client Components

Next.js App Router по умолчанию рендерит компоненты на сервере (RSC).

Правила:

* **По умолчанию компоненты — Server Components.** Не ставь `'use client'` без причины.
* **`'use client'` ставится на минимально необходимом уровне** — на конкретном интерактивном компоненте, не на всём срезе и не на странице целиком.
* **Server Actions живут в `api/` сегменте** соответствующего среза (страницы или виджета), рядом с остальными запросами.

```
src/pages/article/
  ui/
    article-page.tsx          # Server Component (по умолчанию)
    comment-form.tsx          # 'use client' — интерактивная форма
  api/
    get-article.ts            # fetch в RSC / server action
    submit-comment.ts         # server action
```

---

## Data fetching

Весь data-fetching живёт в `api/` сегменте среза:

* серверный `fetch` для RSC
* server actions
* клиентские хуки (React Query / SWR), если нужны
* мапперы, адаптеры, типы ответа

При росте дробим по ответственности (запросы / мутации / типы / адаптеры), но не заранее.

Общий HTTP-клиент, базовые конфиги запросов, переиспользуемые DTO — в `shared/api/`.

---

## Зависимости

Разрешённые направления:

* `app -> pages/widgets/shared` ✅
* `pages -> widgets/shared` ✅
* `widgets -> shared` ✅
* `shared -> (куда угодно)` ❌ (shared ни от кого не зависит)
* `pages <-> pages` ❌
* `widgets <-> widgets` ❌

Импорт из чужого среза — **только через его публичный API** (`index.ts`).
Прямые импорты файлов типа `../other/ui/...` — запрещены.

---

## Сегменты внутри среза

Обычно достаточно:

* **ui** — компоненты/разметка, локальные подкомпоненты. Стилизация — Tailwind (классы в разметке, `cn()` для условий).
* **model** — состояние, бизнес-правила, вычисления, схемы валидации.
* **api** — запросы (fetch/server actions/хуки), мапперы, типы ответа, адаптеры.
* **lib** — локальные утилиты (только для этого среза).
* **config** — локальные настройки/флаги (редко, чаще в shared/app).

Не сваливайте всё в один файл: дробите по ответственности, когда становится тесно.

---

## Публичный API среза

`src/pages/<page>/index.ts` экспортирует только то, что нужно снаружи:

* компонент страницы (`Page` / `ArticlePage` и т.п.)
* компонент layout'а (если есть)
* `generateMetadata` / `generateStaticParams` (если есть)
* (опц.) типы/хелперы, если реально используются извне

То же для `widgets/<widget>/index.ts`.

Правила:

* `index.ts` — **barrel без `export *`**.
* `index.ts` внутри подпапок (`ui/index.ts`, `model/index.ts`) **не создаём**, если нет прямой боли.
* Внутренние штуки (частные компоненты, private hooks) не торчат наружу.

---

## Shared: что можно и что нельзя

**В Shared можно:**

* UI-примитивы и дизайн-система (`shared/ui/`)
* общий HTTP-клиент, конфиги запросов, переиспользуемые DTO/схемы (`shared/api/`)
* утилиты, хелперы, общие типы предметной области (`shared/lib/`)
* инфраструктуру (провайдеры, менеджеры: например, modal manager)

**В Shared нельзя:**

* бизнес-логику конкретной страницы/виджета
* «почти общий» код, который нужен только одному месту (это преждевременный shared)

**Конвенция `shared/api` vs `shared/lib`:**
* `shared/api/` — всё, что связано с транспортом и контрактами API (клиент, DTO, схемы ответов)
* `shared/lib/` — всё остальное (утилиты, форматирование, доменные типы, хелперы)

---

## Интеграция page ↔ widget

Дефолт:

* **страница владеет сценарием страницы**, виджет — **своим сценарием**
* state/правила живут там, где бизнес-смысл

Если модалка/флоу — часть страницы → всё в `pages/<page>`, shared только инфраструктура (менеджер).
Если модалка/флоу — часть виджета → всё в `widgets/<widget>`, страница только вызывает публичный API.

---

## Куда класть код

| Что                              | Куда                                    |
| -------------------------------- | --------------------------------------- |
| Route entrypoint (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`) | `app/**/` (тонкая обёртка) |
| UI страницы/секции/формы         | `src/pages/<page>/ui/`                  |
| Layout страницы (если сложный)   | `src/pages/<page>/ui/`                  |
| Логика данных/сторы страницы     | `src/pages/<page>/model/`               |
| Запросы/server actions страницы  | `src/pages/<page>/api/`                 |
| Большой автономный блок (опц.)   | `src/widgets/<widget>/*`                |
| Общий UI-примитив                | `src/shared/ui/`                        |
| Общая утилита/хелпер             | `src/shared/lib/`                       |
| Общий HTTP-клиент, DTO, схемы    | `src/shared/api/`                       |
| Общие доменные типы              | `src/shared/lib/`                       |
| Инфраструктура приложения        | `src/app/` или `src/shared/*`           |

---

## Когда выносить в widget

Код остаётся в странице по умолчанию. Выносить в `widgets/` стоит, когда:

* блок **автономный** — у него своя модель, свой lifecycle, понятные границы
* блок **большой** — мешает читать страницу (ориентир: >300 строк или >5 внутренних компонентов)
* блок **переиспользуется** на другой странице

Если ни одно из трёх — оставляй в странице.

---

## Принцип роста

Начинай с минимума: держи код в странице.
Выноси в widget, когда блок стал автономным и мешает.
Выноси в shared только когда понадобилось второй раз.

```
# сейчас
src/pages/article/
  ui/
    article-page.tsx
  model/
    use-article.ts

# потом (если блок стал автономным и огромным)
src/widgets/article-reader/
  ui/
  model/
  api/
  index.ts

src/pages/article/
  ui/
    article-page.tsx  # композиция: собирает виджет
```