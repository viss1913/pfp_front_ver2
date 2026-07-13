# Инструкция по установке и запуску

## Требования

- Node.js 18+ (установлен: v24.11.1)
- npm или yarn
- API бэкенд на Railway

## Установка зависимостей

```bash
npm install
```

## Настройка подключения к API (Railway)

1. **Создайте файл `.env.local`** в корне проекта (скопируйте из `env.example`):
```bash
copy env.example .env.local
```

2. **Откройте `.env.local`** и укажите URL вашего API на Railway:
```
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app/api
```

3. **Как узнать URL Railway:**
   - Зайдите на [railway.app](https://railway.app)
   - Откройте ваш проект с API
   - В настройках сервиса найдите **Public URL** или **RAILWAY_PUBLIC_DOMAIN**
   - Это и будет базовый URL (например: `https://pfp-api-production.up.railway.app`)
   - Добавьте `/api` в конец, если API доступно по этому пути

## Запуск в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

**Важно:** 
- Dev сервер Next.js (`npm run dev`) - это только **фронтенд** для разработки
- API бэкенд должен быть доступен на Railway
- Убедитесь, что переменная `NEXT_PUBLIC_API_URL` правильно настроена

## Сборка для production

```bash
npm run build
npm start
```

## Деплой на Vercel

1. Загрузите проект в GitHub/GitLab/Bitbucket
2. Зайдите на [vercel.com](https://vercel.com)
3. Импортируйте проект
4. В настройках проекта добавьте переменную окружения:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** URL вашего API на Railway (например: `https://your-app.railway.app/api`)
5. Нажмите "Deploy"

Vercel автоматически определит Next.js и настроит сборку.

## Структура проекта

- `/app` - Next.js App Router страницы
- `/components` - React компоненты
  - `/ui` - Базовые UI компоненты (Button, Input, Slider и т.д.)
  - `/questionnaire` - Компоненты анкетирования
- `/lib` - Утилиты и конфигурация
  - `api.ts` - Настройка Axios с базовым URL из переменных окружения
  - `api-client.ts` - Функции для работы с API
- `/store` - Zustand stores
- `/types` - TypeScript типы

## Основные страницы

- `/` - Главная страница
- `/question?create` - Процесс создания клиента (анкетирование)

## Проверка подключения к API

После настройки `.env.local` и запуска `npm run dev`, вы можете проверить работу API в браузере через DevTools (Network tab), когда будете отправлять запросы с фронтенда.
