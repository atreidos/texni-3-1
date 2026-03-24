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

Скопируйте `frontend/.env.example` в `frontend/.env` и заполните значения:

```bash
cp frontend/.env.example frontend/.env
```

Пример содержимого `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Опционально — вывод ошибок на экран (для отладки белого экрана и т.п.):

```env
VITE_SHOW_ERRORS=true
```

При `VITE_SHOW_ERRORS=true` ошибки рендера и необработанные промисы показываются в UI. В продакшене оставьте переменную выключенной или не задавайте.

Где взять значения:
- Откройте [supabase.com](https://supabase.com) → ваш проект → **Settings → API**
- `VITE_SUPABASE_URL` — скопируйте **Project URL** как есть (должен начинаться с `https://` и содержать `supabase.co`), не подставляйте localhost
- `VITE_SUPABASE_ANON_KEY` — поле **anon / public** в разделе Project API Keys

После изменения `.env` перезапустите `npm run dev`. В Network (F12) запросы к API идут на ваш домен Supabase (`*.supabase.co`), а не на localhost.

**Для восстановления пароля:** в Supabase Dashboard → Auth → URL Configuration добавьте `https://your-domain.com/auth/reset-password` (и `http://localhost:5173/auth/reset-password` для локальной разработки) в Redirect URLs.
> Префикс `VITE_` обязателен — Vite экспонирует в браузер только переменные с этим префиксом.

### 3. Разверните backend (Supabase)

В репозитории backend-код хранится в папке `backend/supabase/`:

- `backend/supabase/migrations/001_init_schema.sql` — схема БД, триггеры и RLS-политики  
- `backend/supabase/functions/create-payment/index.ts` — Edge Function для записи в `payments` через `service_role`
- `backend/supabase/functions/dadata-find-party/index.ts` — прокси к DaData API для автозаполнения реквизитов по ИНН (требует `DADATA_API_KEY` в Supabase Secrets)
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

**Деплой Edge Functions** (нужен для E2E 05–08 и чтобы в облаке совпадали валидация и формат ошибок с репозиторием):

```bash
# Из корня проекта (после supabase login)
supabase link --project-ref <ваш-project-ref>
```

Одной командой — все функции приложения (включая `documents-create`, `create-payment`):

```bash
supabase functions deploy organizations-create organizations-update organizations-delete organizations-set-main organizations-list profile-get profile-update documents-list documents-create documents-delete dadata-find-party payments-list create-payment --workdir backend
```

Отдельные функции при необходимости:

```bash
supabase functions deploy profile-update --workdir backend
```

Project ref смотрите в Supabase Dashboard → Settings → General. Убедитесь, что `frontend/.env` указывает на тот же проект (`VITE_SUPABASE_URL=https://<project-ref>.supabase.co`).

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
| `npm test` | Playwright E2E тесты |
| `npm run test:ui` | Playwright UI mode |

---

## E2E тесты (Playwright)

В `frontend/e2e/` находятся E2E тесты по сценариям:

1. Регистрация и редирект в личный кабинет
2. Вход и редирект на «Обзор»
3. Неавторизованный пользователь перенаправляется на логин
4. Валидация формы регистрации (пустые поля, пароль, оферта)
5. Создание организации (Яндекс, Озон) — DaData
6. Удаление организации и документа
7. Обновление профиля в настройках

**Запуск:** `cd frontend && npm test` (приложение должно быть на http://localhost:5173, или webServer в playwright.config.js запустит его автоматически).

**Тестовый пользователь:** `auth.setup.js` регистрирует или логинит `test@example.com` / `password123` перед тестами. Confirm email должен быть отключён (Supabase → Auth → Providers → Email).

Полный план тестов (17 сценариев), подготовка и результаты — [frontend/QA.md](frontend/QA.md).

---

## Структура проекта

```
frontend/                     # Frontend (React + Vite), выполняется в браузере
├── e2e/                      # Playwright E2E тесты
├── src/                      # React-код приложения
├── public/                   # статические файлы
├── index.html                # HTML-шаблон
├── vite.config.js            # конфиг Vite
├── eslint.config.js          # конфиг ESLint
├── package.json              # зависимости и скрипты фронта
├── .env.example               # шаблон переменных окружения (в репо)
└── .env                       # переменные окружения Vite (не коммитить — в .gitignore)

backend/                      # Backend (Supabase: БД + Auth + RLS + Edge Functions)
├── supabase/
│   ├── migrations/
│   │   └── 001_init_schema.sql   # SQL-схема (таблицы, триггеры, RLS-политики)
│   └── functions/
│       ├── create-payment/
│       │   └── index.ts          # Edge Function с service_role для записи в payments
│       ├── dadata-find-party/
│       │   └── index.ts          # прокси к DaData API (поиск по ИНН)
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
- `POST /functions/v1/dadata-find-party` — поиск организации через DaData: по ИНН (`body`: `{ inn }`) или по названию (`body`: `{ query }`). Возвращает реквизиты для автозаполнения формы. Требует JWT и `DADATA_API_KEY` в Supabase Secrets.

**DaData:** для работы поиска организации (по названию или ИНН) добавьте секрет. При 401: деплойте с `--no-verify-jwt` — `supabase functions deploy dadata-find-party --no-verify-jwt`. Supabase Dashboard → Project Settings → Edge Functions → Secrets → `DADATA_API_KEY`. Ключ получают на [dadata.ru](https://dadata.ru) (бесплатно до 10 000 запросов/день).

**Invalid JWT / 401:** в `backend/supabase/config.toml` задано `verify_jwt = false` для Edge Functions. JWT проверяется внутри каждой функции через `getUser()`, доступ без токена запрещён. После изменения config переразверните функции (полный список — в блоке «Деплой Edge Functions» выше).

---
## Безопасность

Рекомендации по настройке и эксплуатации — см. [SECURITY.md](SECURITY.md).
