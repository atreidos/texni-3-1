# DocFlow

Веб-сервис для автоматического заполнения и подписи юридических документов (договоры, акты, счета).

**Стек:** React 19 · Vite 7 · Tailwind CSS 4 · React Router 7 · Supabase (Auth + PostgreSQL)

---

## Быстрый старт

### 1. Установите зависимости

```bash
cd frontend
npm install
```

### 2. Настройте переменные окружения

Создайте файл `.env` в `frontend/` (если его ещё нет):

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

### 3. Разверните backend (Supabase)

В репозитории backend-код хранится в папке `backend/supabase/`:

- `backend/supabase/migrations/001_init_schema.sql` — схема БД, триггеры и RLS-политики  
- `backend/supabase/functions/create-payment/index.ts` — Edge Function для записи в `payments` через `service_role`
- остальные Edge Functions (например `organizations-*`, `documents-*`, `profile-*`, `payments-list`) — единственная точка доступа к данным из фронтенда (`/functions/v1/*`)

Есть два варианта развёртывания схемы:

1. **Через Supabase CLI и миграции** (рекомендуется для продакшена)
   - Скопируйте содержимое `supabase/migrations/001_init_schema.sql` в новую миграцию Supabase
     или перенесите файл в каталог миграций вашего Supabase-проекта.
   - Примените миграции (`supabase db push` / `supabase db reset` в зависимости от вашего flow).

2. **Через SQL Editor (быстрый старт)**
   - Скопируйте содержимое `backend/supabase/migrations/001_init_schema.sql`
   - Вставьте в **Supabase → SQL Editor** и выполните скрипт.
   - Это создаст таблицы `profiles`, `organizations`, `documents`, `document_fields`, `payments`,
     а также настроит RLS-политики и триггеры (в том числе автосоздание профиля при регистрации).

### 4. Запустите проект

```bash
cd frontend
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
frontend/                     # Frontend (React + Vite), выполняется в браузере
├── src/                      # React-код приложения
├── public/                   # статические файлы
├── index.html                # HTML-шаблон
├── vite.config.js            # конфиг Vite
├── eslint.config.js          # конфиг ESLint
├── package.json              # зависимости и скрипты фронта
└── .env                      # переменные окружения Vite (не коммитить)

backend/                      # Backend (Supabase: БД + Auth + RLS + Edge Functions)
├── supabase/
│   ├── migrations/
│   │   └── 001_init_schema.sql   # SQL-схема (таблицы, триггеры, RLS-политики)
│   └── functions/
│       ├── create-payment/
│       │   └── index.ts          # Edge Function с service_role для записи в payments
│       ├── organizations-*/
│       ├── documents-*/
│       ├── profile-*/
│       └── payments-list/
└── SQL.md                    # текст SQL (справочно)
```

---
## API (Edge Functions)

Frontend не обращается напрямую к таблицам Supabase. Все чтение/запись данных выполняется через Edge Functions по контракту `/functions/v1/*`.

### Read (GET)
- `GET /functions/v1/organizations-list` — список организаций текущего пользователя
- `GET /functions/v1/documents-list` — список документов текущего пользователя
- `GET /functions/v1/profile-get` — профиль текущего пользователя
- `GET /functions/v1/payments-list` — история платежей текущего пользователя

### Write (POST)
- `POST /functions/v1/organizations-create` — создать организацию (`body`: `form` в camelCase)
- `POST /functions/v1/organizations-update` — обновить организацию (`body`: `{ id, form }`)
- `POST /functions/v1/organizations-delete` — удалить организацию (`body`: `{ id }`)
- `POST /functions/v1/organizations-set-main` — атомарно установить основную организацию (`body`: `{ id }`)
- `POST /functions/v1/documents-delete` — удалить документ (`body`: `{ id }`)
- `POST /functions/v1/profile-update` — обновить профиль (`body`: `{ name, email, phone }`)
