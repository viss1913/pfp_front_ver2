# Content Factory — документация для фронта (Admin + Agent LK)

Backend **уже задеплоен** на `https://pfp-api.bank-future.com/api`.  
HTML генерирует **IDE API** (server-to-server), фронт ходит **только в PFP BFF**.

| Документ | Для кого |
|----------|----------|
| [ADMIN_CONTENT_FACTORY_IDE_TASK.md](./ADMIN_CONTENT_FACTORY_IDE_TASK.md) | Разработчик админки — экраны, API, состояния, миграция со старого UI |
| [DESIGN_PROMPT_UI.md](./DESIGN_PROMPT_UI.md) | Дизайнер / генерация макета (Figma, v0, Midjourney UI) |
| [openapi/OPENAPI_SPEC.yaml](./openapi/OPENAPI_SPEC.yaml) | HTTP-контракт Content Factory v1 (IDE integration) |

## Что изменилось vs старый UI

| Было (v0.1, откатили) | Стало (v1 IDE) |
|------------------------|----------------|
| Шаблоны + Payload JSON | **Brief** + чат с AI |
| Wizard: Мета → Payload → Generate → Чат | **Один экран**: чат слева + preview справа |
| `POST .../generate` + OpenRouter в PFP | Генерация через IDE при create/chat |
| `templates/*` routes | **Убрать** из навигации (API templates нет) |

## Роуты Next.js (целевые)

| URL | Экран |
|-----|--------|
| `/admin/content-factory` | → redirect на `/admin/content-factory/offers` |
| `/admin/content-factory/offers` | Список офферов |
| `/admin/content-factory/offers/new` | Создание (title + brief) |
| `/admin/content-factory/offers/[id]` | **Редактор IDE-like** (главный экран) |

Удалить или спрятать: `/admin/content-factory/templates/*`

## Auth

Как в остальной админке:

- `Authorization: Bearer <JWT>`
- `x-project-key: <project key>`
- Роли: `admin`, `super_admin`

## Быстрый smoke (Postman)

1. `GET /admin/content-factory/health/ide`
2. `POST /admin/content-factory/offers` `{ "title": "Test", "generate": false }`
3. `POST .../offers/1/chat/messages` `{ "content": "..." }`
4. `POST .../offers/1/publish`
