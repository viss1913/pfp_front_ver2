# Задача: выбор A4-шаблона при создании оффера (Content Factory Admin)

**Приоритет:** перед доработкой редактора, блокирует нормальный create flow  
**Backend:** уже на `pfp-api` (деплой с миграциями `base_template_id` + `page_count`, IDE v1.1)  
**OpenAPI:** [openapi/OPENAPI_SPEC.yaml](./openapi/OPENAPI_SPEC.yaml)  
**Связанная задача:** [ADMIN_CONTENT_FACTORY_IDE_TASK.md](./ADMIN_CONTENT_FACTORY_IDE_TASK.md)

---

## Зачем

Админ при создании оффера выбирает **базовый корпоративный шаблон Finam** (4 варианта).  
Шаблоны **не редактируются** в админке — только выбор. Дальше IDE/чат меняет контент внутри выбранной основы.

| ID | Ориентация | Тема |
|----|------------|------|
| `finam-a4-portrait-light` | A4 вертикально | светлый |
| `finam-a4-portrait-dark` | A4 вертикально | тёмный |
| `finam-a4-landscape-light` | A4 горизонтально | светлый |
| `finam-a4-landscape-dark` | A4 горизонтально | тёмный |

Default, если не выбрали: `finam-a4-portrait-light`.

---

## API (только pfp-api)

Auth как везде в админке: `Authorization: Bearer <JWT>` + `x-project-key`.

### 1. Список шаблонов

```
GET /api/admin/content-factory/templates
```

**200:**

```json
{
  "templates": [
    {
      "id": "finam-a4-portrait-light",
      "title": "A4 вертикальный — светлый",
      "orientation": "portrait",
      "theme": "light",
      "format": "a4",
      "page_size": "210x297mm",
      "preview_url": "/api/admin/content-factory/templates/finam-a4-portrait-light/preview"
    }
  ]
}
```

### 2. HTML превью шаблона

```
GET /api/admin/content-factory/templates/{templateId}/preview
```

- Response: `text/html` (полный self-contained документ)
- **404** — неизвестный `templateId`

**Важно:** `preview_url` — относительный путь от API base.  
Превью грузить **через fetch с Bearer**, не через `<iframe src={preview_url}>` — иначе 401.

### 3. Создание оффера (дополнено)

```
POST /api/admin/content-factory/offers
```

```json
{
  "title": "Подушка безопасности",
  "brief": "Одна страница A4, продукт НСЖ…",
  "base_template_id": "finam-a4-portrait-dark",
  "page_count": 1,
  "kind": "product",
  "cta_url_base": "https://…",
  "cta_label": "Оформить",
  "generate": true
}
```

| Поле | UI |
|------|-----|
| `base_template_id` | обязательный выбор в picker (или дефолт portrait-light) |
| `page_count` | число 1–20, default 1 (сколько A4-листов в одном HTML) |
| `title` | как сейчас |
| `brief` | как сейчас |
| `generate` | `true` если brief не пустой |

**201:** в ответе появится `base_template_id` на оффере + `generated_html` (шаблон или после IDE generate).

### 4. PATCH шаблона

`base_template_id` можно менять **только пока нет `ide_session_id`**.  
После create сессии — 400. На практике: выбор только на экране `/offers/new`.

---

## UI — экран `/admin/content-factory/offers/new`

### Текущее состояние

`app/admin/content-factory/offers/new/page.tsx` — форма title + brief без выбора шаблона.

### Целевой layout

```
┌─────────────────────────────────────────────────────────────┐
│ ← К списку    Новый оффер                                   │
├─────────────────────────────────────────────────────────────┤
│ Шаг 1. Базовый шаблон A4                                    │
│ ┌──────────────┐ ┌──────────────┐                             │
│ │ [preview]    │ │ [preview]    │  portrait light | dark    │
│ │ вертик свет  │ │ вертик тёмн  │                           │
│ └──────────────┘ └──────────────┘                           │
│ ┌──────────────┐ ┌──────────────┐                             │
│ │ [preview]    │ │ [preview]    │  landscape light | dark   │
│ └──────────────┘ └──────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│ Шаг 2. Параметры оффера                                     │
│ Title * | Brief | **Страниц A4 (1–20)** | CTA URL | CTA label | expires_at          │
│ [ Создать ] / [ Создать и сгенерировать ]                   │
└─────────────────────────────────────────────────────────────┘
```

### Компоненты (создать)

| Файл | Назначение |
|------|------------|
| `components/admin/content-factory/TemplatePicker.tsx` | сетка 2×2, selected state |
| `components/admin/content-factory/TemplatePreviewCard.tsx` | карточка: iframe srcDoc + title + badges |

Можно переиспользовать стили из `OfferHtmlPreview.tsx` (тёмный фон вокруг «листа»).

### Логика превью

```ts
// lib/content-factory-api.ts — добавить
templatesApi.list(projectKey, token) → { templates }
templatesApi.fetchPreviewHtml(previewUrl, projectKey, token) → string

// В карточке:
const html = await templatesApi.fetchPreviewHtml(t.preview_url, ...);
<iframe sandbox="allow-same-origin" srcDoc={html} className="..." />
```

Масштаб превью в карточке: `transform: scale(0.35)` + `transform-origin: top left` или фиксированный viewport 210mm с overflow hidden — чтобы влезал thumbnail.

### Submit

```ts
await offersApi.create({
  title,
  brief,
  base_template_id: selectedTemplateId,
  page_count: Number(pageCount) || 1,
  ...
}, projectKey, token);
```

Кнопка submit disabled если нет `title` или нет `selectedTemplateId`.

### Loader

Без изменений: если `brief` + `generate` — full-screen loader 1–10 мин.

---

## Изменения в коде (чеклист)

| Файл | Действие |
|------|----------|
| `types/content-factory.ts` | `ContentFactoryTemplate`, `base_template_id`, `page_count` в Offer/Create |
| `lib/content-factory-api.ts` | `templatesApi.list`, `templatesApi.fetchPreviewHtml` |
| `app/admin/content-factory/offers/new/page.tsx` | встроить `TemplatePicker` |
| `components/admin/content-factory/TemplatePicker.tsx` | **новый** |
| `components/admin/content-factory/TemplatePreviewCard.tsx` | **новый** |
| `components/admin/content-factory/OfferMetaPanel.tsx` | показать `base_template_id` read-only в редакторе |

---

## Ошибки

| HTTP | UI |
|------|-----|
| 404 на preview | «Шаблон не найден» + retry |
| 400 `base_template_id cannot be changed…` | не показывать смену шаблона в редакторе |
| 503 / 504 IDE | как в [ADMIN_CONTENT_FACTORY_IDE_TASK.md](./ADMIN_CONTENT_FACTORY_IDE_TASK.md) |

---

## Критерии приёмки

- [ ] При открытии `/offers/new` грузятся 4 шаблона с превью
- [ ] Клик по карточке выделяет шаблон (border / checkmark)
- [ ] POST уходит с `base_template_id` и `page_count`
- [ ] В редакторе оффера виден выбранный шаблон (read-only)
- [ ] Preview шаблонов работает только с JWT (не публичный iframe src)
- [ ] Default `finam-a4-portrait-light` если админ не трогал picker

---

## Smoke (ручной)

```bash
# 1. Список
curl -sS -H "Authorization: Bearer $JWT" -H "x-project-key: $PK" \
  "$API/admin/content-factory/templates"

# 2. Превью
curl -sS -H "Authorization: Bearer $JWT" -H "x-project-key: $PK" \
  "$API/admin/content-factory/templates/finam-a4-portrait-light/preview" | head

# 3. Create
curl -sS -X POST -H "Authorization: Bearer $JWT" -H "x-project-key: $PK" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","base_template_id":"finam-a4-landscape-dark","page_count":2,"generate":false}' \
  "$API/admin/content-factory/offers"
```

---

## Не делать

- CRUD шаблонов в UI (шаблоны правим в backend repo, не в админке)
- Отдельный route `/admin/content-factory/templates` в навигации
- Прямые вызовы ide-api
