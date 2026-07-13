# Design prompt — Content Factory Admin (IDE-like editor)

Скопируй блок **PROMPT** целиком в Figma AI / v0 / Galileo / Midjourney (UI mode) / любой UI-генератор.

Референс-скрин: IDE pilot — split chat + preview, тёмная тема, A4 лист справа, publish сверху.

---

## PROMPT (English, for UI generators)

```
Design a web admin screen for a "Content Factory" — an AI-powered HTML page editor for financial advisors (B2B fintech, Russian UI).

Layout: full viewport, dark IDE-style chrome (#0f1419 background), split 45/55.

TOP BAR (full width, height 56px, dark gray #1a1f2e):
- Left: back link "← Офферы", status pill "Черновик" (amber), document title "Подушка безопасности · НСЖ"
- Right: secondary button "Настройки CTA", primary black button "Опубликовать" (Publish)

LEFT PANEL — Chat (45%, dark background #121820):
- Scrollable message thread
- User bubble (right-aligned, dark blue): Russian text "Нужна страница A4. Логотип Финам в левом углу. Фон придумай сам. Внизу в footer мелким шрифтом ООО Финам, телефон, сайт."
- Attachment chip under user message: "Finamlogo.jpg" with paperclip icon
- System progress block (monospace, subtle border): "site_architect · Формулирую задачу…" with animated dots
- Assistant bubble (left-aligned, #1e2633): summary in Russian "Готово: A4 страница, логотип в шапке, footer с контактами"
- Sticky bottom input area:
  - Multiline placeholder "Правка или задача…"
  - Left: attach file icon
  - Right: primary "Отправить" button

RIGHT PANEL — Preview (55%, darker backdrop #0a0e14):
- Sub-toolbar: segmented control "Desktop | Tablet | A4" (A4 selected)
- Center: white A4 paper card (210×297 aspect, subtle shadow) on dark canvas
- Inside paper: Finam logo top-left, light blue grid background, footer line small gray text
- Preview is NOT a browser URL bar — label "Preview" only (no external deploy link)

BOTTOM COLLAPSIBLE (optional, full width): "Настройки оффера" — fields CTA URL, CTA label, expiry date

Style: clean, professional, McKinsey/consulting fintech. No gradients overload. Inter or system UI font. Rounded corners 8px. Accessible contrast.

Do NOT show: JSON editor, template picker, Yandex publish URL, code editor tabs.

Mobile: stack chat above preview vertically.
```

---

## PROMPT (Russian, для отечественных генераторов)

```
Экран админки «Фабрика контента» — редактор HTML-страниц с AI для финтеха.

Макет: на весь экран, тёмная тема IDE, split 45/55.

Верхняя панель: слева «← Офферы», бейдж «Черновик», название оффера; справа кнопки «Настройки CTA» и чёрная «Опубликовать».

Слева — чат (45%):
- Сообщения пользователя и ассистента на русском
- Вложение файла (логотип jpg)
- Блок прогресса AI: «Бизнес-аналитик · Пишу структуру…»
- Внизу поле «Правка или задача…», скрепка, кнопка «Отправить»

Справа — preview (55%):
- Переключатель Desktop / Tablet / A4
- На тёмном фоне белый лист A4 с тенью
- Внутри листа: логотип Финам, сетчатый фон, footer с телефоном и сайтом

Стиль: строгий B2B, consulting, без JSON-редакторов и без URL публикации на Yandex.

Референс по компоновке: как IDE (чат слева, preview справа), но продукт — PFP Content Factory.
```

---

## Состояния для дизайн-системы

| State | Визуал |
|-------|--------|
| Idle | Чат + статичный preview |
| Generating (SSE) | Progress line под последним сообщением; spinner на «Отправить» disabled |
| Error 422 CTA | Красный toast: «AI удалил кнопку CTA» |
| Published | Бейдж «Опубликован» зелёный; Publish → «Снять с публикации» |
| Empty preview | Placeholder «Создайте оффер или отправьте первую правку в чат» |

---

## Компоненты для handoff в React

| Component | Props / notes |
|-----------|----------------|
| `ContentFactoryEditorLayout` | `offer`, `children` chat + preview |
| `OfferChatPanel` | messages, onSend, onAttach, streaming progress |
| `OfferHtmlPreview` | `html`, `viewport: desktop \| tablet \| a4` |
| `OfferStatusBadge` | draft / published / archived |
| `OfferMetaDrawer` | cta_url, cta_label, expires_at |
| `AgentProgressLine` | agent id → RU label + message |

---

## Цвета (ориентир)

| Token | Hex |
|-------|-----|
| `--cf-bg` | `#0f1419` |
| `--cf-panel` | `#121820` |
| `--cf-border` | `#2a3344` |
| `--cf-paper` | `#ffffff` |
| `--cf-primary` | `#111827` (Publish) |
| `--cf-accent` | `#4f46e5` (links, focus) |

---

## Wireframe (ASCII)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Офферы  [Черновик]  Title                    [Publish]    │
├──────────────────────┬──────────────────────────────────────┤
│ Chat                 │ [Desktop][Tablet][A4]                │
│                      │     ┌──────────────┐                 │
│ User + attachment    │     │  A4 preview  │                 │
│ Progress…            │     │              │                 │
│ Assistant            │     └──────────────┘                 │
│ [input………] [Send]    │                                      │
└──────────────────────┴──────────────────────────────────────┘
```
