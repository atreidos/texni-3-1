# DocFlow

Веб-сервис для автоматического заполнения и подписи юридических документов (договоры, акты, счета).

**Стек:** React 19 · Vite 7 · Tailwind CSS 4 · React Router 7 · Supabase (Auth + PostgreSQL)

---

## Быстрый старт

### 1. Установите зависимости

```bash
npm install
```

### 2. Настройте переменные окружения

Создайте файл `.env` в корне проекта (если его ещё нет):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Опционально — вывод ошибок на экран (для отладки белого экрана и т.п.):

```env
VITE_SHOW_ERRORS=true
```

При `VITE_SHOW_ERRORS=true` ошибки рендера и необработанные промисы показываются в UI. В продакшене оставьте переменную выключенной или не задавайте.

Опционально — кнопка «Заполнить фейковыми данными» в форме организации (удобно для разработки):

```env
VITE_ALLOW_FAKE_ORG_DATA=true
```

Если переменная не задана или `false`, кнопка не отображается.

Где взять значения:
- Откройте [supabase.com](https://supabase.com) → ваш проект → **Settings → API**
- `VITE_SUPABASE_URL` — скопируйте **Project URL** как есть (должен начинаться с `https://` и содержать `supabase.co`), не подставляйте localhost
- `VITE_SUPABASE_ANON_KEY` — поле **anon / public** в разделе Project API Keys

После изменения `.env` перезапустите `npm run dev`. В Network (F12) запросы к API идут на ваш домен Supabase (`*.supabase.co`), а не на localhost.
> Префикс `VITE_` обязателен — Vite экспонирует в браузер только переменные с этим префиксом.

### 3. Разверните схему БД в Supabase

Скопируйте содержимое `SQL.md` и выполните его в **Supabase → SQL Editor**.  
Это создаёт таблицы `profiles`, `organizations`, `documents`, `document_fields`, `payments`,  
RLS-политики и триггеры (в том числе автосоздание профиля при регистрации).

### 4. Запустите проект

```bash
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173)

---

## Доступные команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер с HMR |
| `npm run build` | Production-сборка |
| `npm run preview` | Предпросмотр production-сборки |
| `npm run lint` | ESLint |

---

## Структура проекта

```
src/
├── config.js                # Конфиг (в т.ч. VITE_SHOW_ERRORS для вывода ошибок на экран)
├── lib/
│   └── supabase.js          # Supabase client (singleton)
├── context/
│   └── AuthContext.jsx      # Auth state + profile из БД
├── components/               # ErrorBoundary, UnhandledRejectionHandler, Header, Sidebar, …
├── pages/
│   ├── auth/                # Вход, регистрация, восстановление пароля
│   └── dashboard/           # Личный кабинет (документы, орги, биллинг, настройки)
└── data/
    └── mockData.js          # Статические данные (тарифы, отзывы, поля редактора)
```
