# commission_schema — контракт для админки (продукты)

Документ для фронта: динамическая форма правил комиссии и сборка payload без `FORBIDDEN_FIELD`.

## API

| Метод | Назначение |
|-------|------------|
| `GET /api/pfp/commission-schema/meta` | Метаданные: `rule_types`, `required_fields`, `optional_fields`, ограничения |
| `GET /api/pfp/products/commission-schema/meta` | Алиас того же meta |
| `POST /api/pfp/products` | Создание продукта с `commission_schema` |
| `PUT /api/pfp/products/{id}` | Обновление продукта с `commission_schema` |

Auth и tenant — как у остальных `/api/pfp/*` (`Authorization`, `x-project-key` при необходимости).

OpenAPI: `OPENAPI_SPEC.yaml` — схемы `CommissionSchema`, `CommissionSchemaMeta`, `ValidationErrorResponse`.

## Поведение PUT

| Тело запроса | Результат |
|--------------|-----------|
| `commission_schema` не передан | Старое значение сохраняется |
| `commission_schema: null` | Схема очищается |
| `commission_schema: { ... }` | Полная замена схемы |

## Общие правила UI

1. `commission_schema.version = 1`, массив `rules` не пустой.
2. На каждое правило обязательно поле `rule_type`.
3. **Не отправлять поле**, если его нет в колонке «Отправлять в API» (даже `null` / пустая строка).
4. Если у `rule_type` один вариант в `allowed_frequency`, но `frequency` **не** в `optional_fields` — **не слать** `frequency` (бэкенд подставит сам).
5. Ошибки валидации: HTTP **422**, тело с `details[].field_path` для подсветки полей.

### Пример ошибки

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid commission_schema",
  "details": [
    {
      "code": "FORBIDDEN_FIELD",
      "field_path": "commission_schema.rules[0].frequency",
      "message": "Field \"frequency\" is not allowed for this rule_type"
    }
  ]
}
```

## Матрица полей по rule_type

Источник правды при рендере: ответ `GET /api/pfp/commission-schema/meta` (поля `required_fields`, `optional_fields`, `allowed_base`, `allowed_frequency`, `supports_years`, `supports_tiers`).

| rule_type | UI: показать | Обязательно | Опционально | Отправлять в API | Не отправлять |
|-----------|--------------|-------------|-------------|------------------|---------------|
| `ONE_TIME_FIXED` | `fixed_amount_rub`, `name` | `fixed_amount_rub` | `name` | `rule_type`, `fixed_amount_rub`, `name?` | `base`, `frequency`, `rate_percent`, `years`, `tiers` |
| `ONE_TIME_PERCENT_OF_PREMIUM` | `rate_percent`, `base`, `name` | `rate_percent`, `base` | `name` | `rule_type`, `rate_percent`, `base`, `name?` | **`frequency`**, `fixed_amount_rub`, `years`, `tiers` |
| `FIRST_YEAR_PERCENT_OF_PREMIUMS` | `rate_percent`, `base`, `years`, `name` | `rate_percent`, `base` | `name`, `years` | `rule_type`, `rate_percent`, `base`, `name?`, `years?` | **`frequency`**, `fixed_amount_rub`, `tiers` |
| `ANNUAL_PERCENT_OF_PREMIUM` | `rate_percent`, `base`, `years`, `name` | `rate_percent`, `base` | `name`, `years` | `rule_type`, `rate_percent`, `base`, `name?`, `years?` | **`frequency`**, `fixed_amount_rub`, `tiers` |
| `AUM_MANAGEMENT_FEE` | `rate_percent`, `base` (= AUM), `frequency`, `years`, `name` | `rate_percent`, `base` | `name`, `frequency`, `years` | `rule_type`, `rate_percent`, `base`, `name?`, `frequency?`, `years?` | `fixed_amount_rub`, `tiers`; `base` только `AUM_AVG` |
| `TIERED_BY_YEAR` | `base`, `tiers[]`, `frequency`, `name` | `base`, `tiers` | `name`, `frequency` | `rule_type`, `base`, `tiers`, `name?`, `frequency?` | **`rate_percent` (верхний уровень)**, `fixed_amount_rub`, `years` |

## base — допустимые значения

| rule_type | allowed_base |
|-----------|--------------|
| `ONE_TIME_FIXED` | — (поле не используется) |
| `ONE_TIME_PERCENT_OF_PREMIUM` | `INITIAL`, `FLOW`, `INITIAL_PLUS_FLOW` |
| `FIRST_YEAR_PERCENT_OF_PREMIUMS` | `INITIAL`, `FLOW`, `INITIAL_PLUS_FLOW` |
| `ANNUAL_PERCENT_OF_PREMIUM` | `INITIAL`, `FLOW`, `INITIAL_PLUS_FLOW` |
| `AUM_MANAGEMENT_FEE` | только `AUM_AVG` |
| `TIERED_BY_YEAR` | `INITIAL`, `FLOW`, `INITIAL_PLUS_FLOW`, `AUM_AVG` |

Смысл для прогноза CRM:

- `INITIAL` — стартовый взнос (`assets_allocation`)
- `FLOW` — поток взносов (`cash_flow_allocation`)
- `INITIAL_PLUS_FLOW` — сумма обоих
- `AUM_AVG` — средний капитал за год (management fee)

## frequency — когда показывать и слать

| rule_type | В UI | В payload |
|-----------|------|-----------|
| `ONE_TIME_*` | можно скрыть | **не слать** |
| `FIRST_YEAR_*`, `ANNUAL_*` | можно скрыть | **не слать** |
| `AUM_MANAGEMENT_FEE` | `MONTHLY` / `YEARLY` | слать, если пользователь выбрал |
| `TIERED_BY_YEAR` | обычно `YEARLY` | слать, если выбрал |

## tiers[] (только TIERED_BY_YEAR)

Каждый элемент:

- `year_from` (int, 1–100)
- `year_to` (int, 1–100, `>= year_from`)
- `rate_percent` (0–100)

Бэкенд: без пересечений интервалов, сортировка по `year_from`.

## field_constraints (из meta)

| Поле | Ограничение |
|------|-------------|
| `rate_percent` | 0–100 |
| `fixed_amount_rub` | ≥ 0 |
| `years.start`, `years.end` | 1–100, `end >= start` |
| `tier.year_from`, `tier.year_to` | 1–100, `year_to >= year_from` |
| `tier.rate_percent` | 0–100 |

## Примеры payload

### 30% от стартового взноса (подушка / assets)

```json
{
  "commission_schema": {
    "version": 1,
    "rules": [
      {
        "rule_type": "ONE_TIME_PERCENT_OF_PREMIUM",
        "base": "INITIAL",
        "rate_percent": 30
      }
    ]
  }
}
```

### Фиксированная комиссия

```json
{
  "commission_schema": {
    "version": 1,
    "rules": [
      {
        "rule_type": "ONE_TIME_FIXED",
        "fixed_amount_rub": 50000
      }
    ]
  }
}
```

### Градация по годам

```json
{
  "commission_schema": {
    "version": 1,
    "rules": [
      {
        "rule_type": "TIERED_BY_YEAR",
        "base": "FLOW",
        "tiers": [
          { "year_from": 1, "year_to": 1, "rate_percent": 8 },
          { "year_from": 2, "year_to": 5, "rate_percent": 5 }
        ]
      }
    ]
  }
}
```

## Сборка payload на фронте (псевдокод)

```text
meta = GET /api/pfp/commission-schema/meta

for each rule in form.rules:
  t = meta.rule_types.find(x => x.code === rule.rule_type)
  payloadRule = { rule_type: rule.rule_type }

  allowed = t.required_fields + t.optional_fields
  for field in allowed:
    if field === 'tiers' and t.supports_tiers:
      if rule.tiers?.length: payloadRule.tiers = rule.tiers
    else if field === 'years' and t.supports_years:
      if rule.years: payloadRule.years = rule.years
    else if rule[field] != null && rule[field] !== '':
      payloadRule[field] = rule[field]

  rules.push(payloadRule)

body.commission_schema = { version: 1, rules }
```

**Не копировать** весь state формы в API — только whitelist из meta для выбранного `rule_type`.

## CRM (прогноз, не факт выплаты)

После сохранения `commission_schema` на продукте прогноз считается из `goals_summary` клиента:

- `GET /api/pfp/crm/dashboard` — `commission_year_1_rub`, `commission_total_rub`, `commission_by_product[]`
- `GET /api/pfp/crm/commission-forecast?client_id=` — детально + `series[]` по годам для графика

См. `agent_lk.yaml` (если подключён в проекте фронта).
