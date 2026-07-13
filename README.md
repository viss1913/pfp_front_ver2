# Личный кабинет финансового консультанта (ПФП)

Программа личных финансовых планов

## Технологии

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form
- React Query (TanStack Query)
- Zustand
- Axios

## Установка

```bash
npm install
```

## Настройка API

1. Скопируйте файл `.env.local.example` в `.env.local`:
```bash
copy .env.local.example .env.local
```

2. Откройте `.env.local` и укажите URL вашего API на Railway:
```
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app/api
```

## Запуск в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

**Важно:** Dev сервер Next.js запускает только фронтенд. API должен быть доступен на Railway.

## Сборка для production

```bash
npm run build
npm start
```

## Деплой на Vercel

Проект готов для деплоя на Vercel. 

1. Загрузите проект в Git репозиторий
2. Подключите репозиторий к Vercel
3. В настройках Vercel добавьте переменную окружения:
   - `NEXT_PUBLIC_API_URL` = URL вашего API на Railway

Vercel автоматически определит Next.js и настроит сборку.

## Структура проекта

- `/app` - Next.js App Router страницы и layout
- `/components` - React компоненты
- `/lib` - Утилиты и конфигурация
- `/hooks` - Custom React hooks
- `/store` - Zustand store
- `/types` - TypeScript типы

## Важно

- **Dev сервер Next.js** (`npm run dev`) - это только фронтенд для разработки
- **API бэкенд** находится на Railway
- Убедитесь, что переменная `NEXT_PUBLIC_API_URL` указывает на правильный URL Railway
