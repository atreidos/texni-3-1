# ARCHITECTURE.md — DocFlow (frontend + backend)

## Стек

- **Vite 7** — сборщик, dev-сервер (frontend)
- **React 19** — UI-библиотека
- **React Router DOM 7** — маршрутизация (client-side)
- **Tailwind CSS 4** — утилитарные стили
- **Lucide React** — иконки
- **@supabase/supabase-js** — клиент Supabase (Auth + PostgreSQL) на фронте
- **Supabase** — backend-платформа (PostgreSQL + Auth + PostgREST + Edge Functions)

---

## Структура файлов

### Frontend (`frontend/src/`)

```
frontend/
├── index.html
├── vite.config.js
├── eslint.config.js
├── package.json
├── public/
└── src/
├── main.jsx               # Точка входа: ErrorBoundary + UnhandledRejectionHandler + BrowserRouter + AuthProvider + App
├── App.jsx                # Маршруты + PrivateRoute (проверяет loading → isLoggedIn)
├── index.css              # Tailwind @import + базовые стили
├── config.js              # Конфиг из .env: showErrorsOnScreen (VITE_SHOW_ERRORS), allowFakeOrgData (VITE_ALLOW_FAKE_ORG_DATA)
│
├── lib/
│   └── supabase.js        # Supabase client (singleton), читает VITE_SUPABASE_* из .env
│
├── context/
│   └── AuthContext.jsx    # Глобальный auth: user (Supabase), profile (из таблицы profiles),
│                          # isLoggedIn, loading, login/register/logout/refreshProfile
│
├── data/
│   └── mockData.js        # СТАТИЧЕСКИЕ данные: PLAN_LABELS, mockPlans, mockTestimonials, mockDocumentFields,
│                          # fakeOrgForm (для кнопки «Заполнить фейковыми данными» при allowFakeOrgData)
│
├── components/
│   ├── ErrorBoundary.jsx  # Перехват ошибок рендера React; при VITE_SHOW_ERRORS=true — вывод на экран
│   ├── UnhandledRejectionHandler.jsx # Показ необработанных ошибок промисов (при VITE_SHOW_ERRORS=true)
│   ├── Header.jsx         # Публичная шапка; использует profile?.name
│   ├── Sidebar.jsx        # Навигация ЛК
│   ├── DashboardLayout.jsx # Обёртка: Sidebar + шапка ЛК; использует profile?.name
│   ├── Modal.jsx          # Универсальный модальный компонент
│   ├── FileUploader.jsx   # Drag-and-drop загрузка .docx/.pdf
│   ├── PricingCard.jsx    # Карточка тарифа
│   ├── StatusBadge.jsx    # Бейдж статуса документа
│   └── ProBadge.jsx       # Бейдж «PRO»
│
└── pages/
    ├── LandingPage.jsx    # / — публичная; данные: mockTestimonials, mockPlans (статика)
    ├── EditorPage.jsx     # /editor — публичная; данные: mockDocumentFields (статика)
    ├── PricingPage.jsx    # /pricing — публичная; данные: mockPlans (статика)
    ├── NotFoundPage.jsx   # 404
    │
    ├── auth/
    │   ├── LoginPage.jsx          # supabase.auth.signInWithPassword; loading + error state
    │   ├── RegisterPage.jsx       # supabase.auth.signUp; loading + error state
    │   └── ForgotPasswordPage.jsx # (пока заглушка)
    │
    └── dashboard/
        ├── DashboardPage.jsx      # fetch documents + organizations join; profile из контекста
        ├── DocumentsPage.jsx      # fetch documents + organizations join; delete
        ├── OrganizationsPage.jsx  # полный CRUD: fetch/insert/update/delete; маппинг DB ↔ форма
        ├── SignaturePage.jsx      # (пока заглушка)
        ├── BillingPage.jsx        # fetch payments; profile из контекста
        └── SettingsPage.jsx       # update profiles; supabase.auth.updateUser (пароль)
```

### Backend (`backend/supabase/` в репозитории, Supabase в облаке)

Весь backend исполняется на стороне Supabase, а не в Node/Django и т.п. Репозиторий хранит инфраструктурный код:

```
backend/
└── supabase/
├── migrations/
│   └── 001_init_schema.sql   # SQL-схема БД, триггеры, RLS-политики (вынесено из SQL.md)
└── functions/
    └── create-payment/
        └── index.ts          # Edge Function под service_role для INSERT в payments
```

Edge Functions деплоятся через Supabase CLI (`supabase functions deploy create-payment`), а переменные `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` задаются в настройках проекта Supabase.

---

## Логика авторизации

`AuthContext` управляет всем жизненным циклом сессии:

| Поле / метод | Тип | Описание |
|---|---|---|
| `user` | Supabase User | объект сессии (`id`, `email`, …) |
| `profile` | Row из `profiles` | `name`, `phone`, `plan`, `docs_used`, … |
| `isLoggedIn` | boolean | `true` при активной сессии |
| `loading` | boolean | `true` пока идёт начальная проверка сессии |
| `login(email, pw)` | async | `signInWithPassword`, бросает ошибку при неудаче |
| `register(name, email, pw)` | async | `signUp` + передаём `name` в `user_meta_data` |
| `logout()` | async | `signOut` |
| `refreshProfile()` | async | перечитывает профиль из БД (после обновлений) |

**Восстановление сессии:**  
При старте приложения `getSession()` + `onAuthStateChange` восстанавливают сессию из localStorage — перезагрузка страницы не разлогинивает пользователя.

**PrivateRoute:**  
Пока `loading === true` — рендерит `null` (не редиректит).  
Когда `loading === false && isLoggedIn === false` — редирект на `/auth/login`.

---

## Вывод ошибок на экран (отладка)

Чтобы видеть причину белого экрана или падений после обновления страницы:

- В **.env** задайте `VITE_SHOW_ERRORS=true` (или `VITE_SHOW_ERRORS=1`).
- Конфиг читается в **src/config.js** (`showErrorsOnScreen`).
- **ErrorBoundary** перехватывает ошибки рендера React и при включённом флаге показывает сообщение и component stack.
- **UnhandledRejectionHandler** подписывается на `unhandledrejection` и при включённом флаге показывает ошибку в оверлее (например, падение при загрузке профиля в AuthContext).

Выключить: удалить `VITE_SHOW_ERRORS` из .env или поставить `VITE_SHOW_ERRORS=false`. В продакшене вывод ошибок не включать.

---

## Слой данных: Supabase

### Откуда берётся что

| Данные | Источник | Таблица / API |
|--------|----------|---------------|
| Сессия, токен | Supabase Auth | `auth.users` |
| Профиль (имя, план, лимиты) | `AuthContext.profile` | `profiles` |
| Документы | fetch при монтировании | `documents` JOIN `organizations` |
| Организации | fetch при монтировании | `organizations` |
| История платежей | fetch при монтировании | `payments` |
| Тарифы (описание) | `mockData.js` | статика на фронте |
| Поля редактора | `mockData.js` | статика на фронте |
| Отзывы | `mockData.js` | статика на фронте |

### Маппинг organizations (БД ↔ форма)

Банковские данные хранятся в плоских колонках БД:

| Форма (camelCase) | БД (snake_case) |
|---|---|
| `isMain` | `is_main` |
| `bank.bik` | `bank_bik` |
| `bank.bankName` | `bank_name` |
| `bank.checkingAccount` | `checking_account` |
| `bank.correspondentAccount` | `correspondent_account` |

Функции `orgFromDb()` и `orgToDb()` в `OrganizationsPage.jsx` инкапсулируют этот маппинг.

### loading / error states

Каждая страница с async-данными:
- При загрузке показывает спиннер (`<Loader2 className="animate-spin" />`) с текстом «Загрузка...»
- При ошибке показывает `<AlertCircle />` + текст ошибки из Supabase; на «Документы» и «Организации» — кнопка «Повторить»
- Загрузка документов и организаций ограничена таймаутом 30 с; при превышении — сообщение и «Повторить»
- Кнопки «Сохранить» блокируются (`disabled`) во время запроса

---

## Правило авторизации для write-операций

Все `POST / PUT / PATCH / DELETE` запросы выполняются только при `isLoggedIn === true`.  
RLS на стороне Supabase дублирует эту защиту независимо от фронтенда.

---

## Маршруты

| Путь | Страница | Доступ |
|------|----------|--------|
| `/` | Авторизованный → редирект на /dashboard (Обзор), иначе лендинг | Все |
| `/editor` | Редактор | Все |
| `/pricing` | Тарифы | Все |
| `/auth/login` | Вход | Все |
| `/auth/register` | Регистрация | Все |
| `/auth/forgot-password` | Восстановление пароля | Все |
| `/dashboard` | Обзор ЛК | Авторизованные |
| `/dashboard/documents` | Мои документы | Авторизованные |
| `/dashboard/organizations` | Организации | Авторизованные |
| `/dashboard/signature` | ЭЦП | Авторизованные |
| `/dashboard/billing` | Тариф и оплата | Авторизованные |
| `/dashboard/settings` | Настройки профиля | Авторизованные |
| `*` | 404 | Все |

---

## Схема базы данных (Supabase / PostgreSQL)

Готовый SQL-скрипт: **[backend/SQL.md](./backend/SQL.md)**

### Таблицы

| Таблица | PK | Ключевые поля | Описание |
|---------|-----|---------------|----------|
| `profiles` | `id` (FK → `auth.users`) | `name`, `plan`, `docs_used`, `docs_limit` | Профиль; создаётся триггером при регистрации |
| `organizations` | `uuid` | `user_id`, `inn`, `ogrn`, `is_main`, `bank_*` | Реквизиты организаций пользователя |
| `documents` | `uuid` | `user_id`, `organization_id`, `name`, `type`, `status`, `size_bytes` | Документы |
| `document_fields` | `uuid` | `document_id`, `field_key`, `group_name`, `value` | Поля документа (ключ-значение) |
| `payments` | `uuid` | `user_id`, `plan`, `amount`, `status`, `paid_at` | История платежей (INSERT только через service_role) |

### Ключевые архитектурные решения БД

- **RLS включён на всех таблицах** — аноним не имеет доступа к данным.
- **`payments` INSERT только через `service_role`** — платёж создаётся бэкендом после подтверждения платёжного шлюза.
- **`docs_used` обновляется триггером** — автоматически при INSERT/DELETE в `documents`.
- **`handle_new_user()`** — триггер на `auth.users` создаёт строку в `profiles` при регистрации.
- **Одна основная организация** — в БД закреплено ограничение: у одного `user_id` может быть максимум одна запись в `organizations` с `is_main = true` (миграция `backend/supabase/migrations/002_organizations_one_main_per_user.sql`).
