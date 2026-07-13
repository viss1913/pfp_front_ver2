# Задача: Content Factory Admin UI (IDE integration)

## Цель продукта

Админ проекта создаёт **маркетинговые HTML-страницы** (A4 / print) для агентов: лендинги продуктов, офферы, one-pager.  
Редактирование — **как в IDE**: чат с AI слева, живой preview справа.  
После publish оффер попадает в **каталог агента** → агент собирает PDF-презентацию и шлёт клиенту.

**Фронт не вызывает ide-api напрямую.** Только `pfp-api` → `/admin/content-factory/*`.

---

## Референс UX (как должно ощущаться)

Ориентир — IDE pilot (скрин в `DESIGN_PROMPT_UI.md`):

- Split 50/50: **чат | preview**
- Тёмная оболочка IDE, белый «лист A4» в preview
- В чате: сообщения пользователя, прогресс агентов, ответ «что сделано»
- Внизу чата: поле «Правка или задача…», скрепка, «Отправить»
- Сверху: статус оффера, название, **Publish**

**Отличия от IDE pilot:**

| IDE pilot | PFP Admin CF |
|-----------|----------------|
| Publish на Yandex | **Publish в каталог PFP** (`POST .../publish`) |
| Preview по внешнему URL | **iframe `srcDoc={generated_html}`** |
| Grok CLI в UI | SSE `progress`: orchestrator / site_architect / code_generator |
| Нет CTA настройки | Поля **CTA URL + label** (PFP подставляет в `data-cta-slot`) |

---

## Экран 1 — Список офферов

**Route:** `/admin/content-factory/offers`

### API

```
GET /api/admin/content-factory/offers?status=draft|published|archived
```

### UI

- Таблица / карточки: `title`, `status`, `updated_at`, `published_at`, `expires_at`
- Фильтр по status (tabs: Все / Черновики / Опубликованные / Архив)
- Кнопка **«Создать оффер»** → `/offers/new`
- Row actions: Открыть, Publish (если draft), Unpublish, В архив

### Empty state

«Создайте первый оффер — опишите продукт в brief, AI соберёт A4-страницу»

---

## Экран 2 — Создание оффера

**Route:** `/admin/content-factory/offers/new`

### API

```
POST /api/admin/content-factory/offers
```

### Body

```json
{
  "title": "Подушка безопасности",
  "brief": "Одна страница A4, продукт НСЖ, логотип в шапке, CTA внизу",
  "kind": "product",
  "cta_url_base": "https://partner.example/offer",
  "cta_label": "Оформить",
  "generate": true
}
```

| Поле | UI |
|------|-----|
| `title` | обязательное |
| `brief` | textarea, необязательно; если пусто — A4-шаблон без LLM |
| `cta_url_base`, `cta_label` | опционально на create, можно позже в редакторе |
| `generate` | default `true` если brief заполнен; `false` — быстрый шаблон |

### UX

- Если `brief` + `generate: true` → **full-screen loader** 1–10 мин («AI генерирует страницу…»)
- После 201 → redirect на `/offers/[id]` с `generated_html` в state/refresh

---

## Экран 3 — Редактор (главный)

**Route:** `/admin/content-factory/offers/[id]`

### Layout (desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ← Офферы   [Черновик ▼]  «Подушка безопасности»     [Сохранить CTA] [Publish] │
├─────────────────────────────┬────────────────────────────────────────────┤
│ CHAT (~45%)                 │ PREVIEW (~55%)                             │
│                             │  [Desktop] [Tablet] [A4]                     │
│  User: Нужна страница A4…   │  ┌─────────────────────┐                   │
│  📎 Finamlogo.jpg           │  │  iframe srcDoc      │                   │
│                             │  │  (белый лист A4)    │                   │
│  Assistant: Готово…         │  │                     │                   │
│                             │  └─────────────────────┘                   │
│  ● site_architect running   │                                            │
│                             │                                            │
│  ┌───────────────────────┐  │                                            │
│  │ Правка или задача…  📎 │  │                                            │
│  │              Отправить │  │                                            │
│  └───────────────────────┘  │                                            │
├─────────────────────────────┴────────────────────────────────────────────┤
│ ▼ Настройки оффера (collapsible)                                           │
│ CTA URL | CTA label | Срок публикации | kind                               │
└──────────────────────────────────────────────────────────────────────────┘
```

### API — загрузка

```
GET /api/admin/content-factory/offers/:id
GET /api/admin/content-factory/offers/:id/chat/messages
GET /api/admin/content-factory/offers/:id/media          (optional)
GET /api/admin/content-factory/health/ide                 (диагностика)
```

Query `?sync=1` на GET offer — подтянуть html из IDE session.

### API — метаданные

```
PATCH /api/admin/content-factory/offers/:id
{ title, brief, cta_url_base, cta_label, expires_at, kind }
```

**Не редактировать `generated_html` руками** — только через чат.

### API — чат (ключевое)

**История:**

```
GET .../offers/:id/chat/messages
→ [{ role: "user"|"assistant", content, created_at }]
```

**Отправка с SSE (основной путь):**

```
POST .../offers/:id/chat/messages?stream=1
Headers: Accept: text/event-stream
Body: {
  "content": "Сделай заголовок крупнее",
  "attachments": [
    { "ref": "media:logo.png", "role": "logo", "instruction": "в шапку слева" }
  ]
}
```

**SSE events:**

| event | data | UI |
|-------|------|-----|
| `hello` | `{ ok: true }` | начать сессию |
| `progress` | `{ agent, message, status }` | строка статуса / stepper |
| `result` | `{ html, assistant_message }` | обновить preview (html уже в БД) |
| `done` | `{ ok: true }` | убрать loader |
| `error` | `{ error, message }` | toast, не менять preview |

**Лейблы агентов для UI:**

| agent | RU label |
|-------|----------|
| `orchestrator` | Планировщик |
| `site_architect` | Бизнес-аналитик |
| `code_generator` | Программист |

**Fallback без SSE** (отладка):

```
POST .../chat/messages  (без stream=1)
→ { offer, messages, preview_html, assistant_message }
```

Реализация SSE на fetch:

```ts
const res = await fetch(url, {
  method: "POST",
  headers: { ...auth, Accept: "text/event-stream" },
  body: JSON.stringify({ content }),
});
const reader = res.body!.getReader();
// парсить "event: ...\ndata: {...}\n\n"
```

### API — медиа

```
POST .../offers/:id/media
{ files: [{ name, content_base64, content_type, kind: "logo"|"chart_data"|... }] }

GET .../offers/:id/media
```

Flow:

1. User выбирает файл → base64 → POST media
2. В чате attachment `{ ref: "media:logo.png", role: "logo", instruction: "..." }`

### Preview

```tsx
<iframe
  title="preview"
  sandbox="allow-same-origin"
  srcDoc={offer.generated_html ?? ""}
  className="w-full h-full bg-slate-900 ..."
/>
```

- Toggle **Desktop / Tablet / A4**: менять width iframe (1280 / 768 / 210mm)
- **Без utm** в preview — utm только в PDF агента

### Publish bar

```
POST .../offers/:id/publish      — status → published
POST .../offers/:id/unpublish    — → draft
DELETE .../offers/:id            — → archived
```

Publish disabled если нет `generated_html` или нет `data-cta-slot` в html.

---

## Ошибки

| HTTP | UI |
|------|-----|
| 422 | «AI удалил кнопку CTA — попросите вернуть `<a data-cta-slot>`» |
| 503 | «IDE не настроен на backend» |
| 504 | «Таймаут генерации — повторите» |

---

## Что переделать в текущем коде (`Front PFP ver 2`)

| Файл | Действие |
|------|----------|
| `app/admin/content-factory/page.tsx` | redirect → `/offers`, не `/templates` |
| `app/admin/content-factory/templates/*` | удалить или 410 stub |
| `app/admin/content-factory/offers/[id]/page.tsx` | **переписать**: убрать wizard steps Payload/Generate, сделать split chat+preview |
| `app/admin/content-factory/offers/new/page.tsx` | title + brief вместо template_id + payload |
| `lib/content-factory-api.ts` | убрать templatesApi, generate; добавить patch, media, SSE chat, health |
| `types/content-factory.ts` | `ide_session_id`, `brief`; убрать template_id/payload обязательность |

---

## Agent LK (фаза 2, тот же API family)

Если админка готова — отдельная задача на ЛК агента:

- `GET /pfp/content-factory/offers` — каталог
- Presentations wizard → PDF → email

Контракт: `openapi/OPENAPI_SPEC.yaml`, tag `ContentFactoryAgent`.

---

## Критерии приёмки (MVP)

- [ ] Список офферов с фильтром status
- [ ] Create с brief → редактор с html
- [ ] Split UI: чат + iframe preview
- [ ] Chat с SSE progress + обновление preview на `result`
- [ ] Upload logo через media + attachment в чате
- [ ] PATCH cta_url / cta_label
- [ ] Publish / unpublish
- [ ] Нет routes/templates в навигации
- [ ] 422 показывается понятным текстом
