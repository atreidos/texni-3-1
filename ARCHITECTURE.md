# ARCHITECTURE.md — DocFlow Frontend V1

## Стек
- **Vite** — сборщик, dev-сервер
- **React 19** — UI-библиотека
- **React Router DOM v7** — маршрутизация (client-side)
- **Tailwind CSS v4** — утилитарные стили
- **Lucide React** — иконки

---

## Структура файлов

```
src/
├── main.jsx               # Точка входа. BrowserRouter + AuthProvider + App
├── App.jsx                # Все маршруты приложения (Routes/Route)
├── index.css              # Tailwind @import + базовые стили
│
├── context/
│   └── AuthContext.jsx    # Глобальное состояние авторизации (isLoggedIn, user, login, logout)
│
├── data/
│   └── mockData.js        # Все моковые данные: пользователь, документы, организации, тарифы
│
├── components/            # Переиспользуемые компоненты
│   ├── Header.jsx         # Шапка публичных страниц (лого, навигация, кнопки входа)
│   ├── Sidebar.jsx        # Боковая навигация личного кабинета
│   ├── DashboardLayout.jsx # Обёртка = Sidebar + шапка ЛК + main-область
│   ├── Modal.jsx          # Универсальное модальное окно (isOpen, onClose, title, size)
│   ├── FileUploader.jsx   # Drag-and-drop зона загрузки файлов
│   ├── PricingCard.jsx    # Карточка тарифного плана
│   ├── StatusBadge.jsx    # Бейдж статуса документа (черновик/заполнен/подписан)
│   └── ProBadge.jsx       # Маленький бейдж «PRO» для платных функций
│
├── pages/
│   ├── LandingPage.jsx    # / — Hero, Возможности, Как работает, Тарифы, Отзывы, Footer
│   ├── EditorPage.jsx     # /editor — загрузка файла → split-view редактор
│   ├── PricingPage.jsx    # /pricing — тарифы + таблица сравнения + FAQ
│   ├── NotFoundPage.jsx   # * — страница 404
│   │
│   ├── auth/
│   │   ├── LoginPage.jsx          # /auth/login
│   │   ├── RegisterPage.jsx       # /auth/register
│   │   └── ForgotPasswordPage.jsx # /auth/forgot-password
│   │
│   └── dashboard/
│       ├── DashboardPage.jsx      # /dashboard — обзор, быстрые действия
│       ├── DocumentsPage.jsx      # /dashboard/documents — список, фильтры, поиск
│       ├── OrganizationsPage.jsx  # /dashboard/organizations — карточки + модалка
│       ├── SignaturePage.jsx      # /dashboard/signature — ЭЦП: подписать / проверить
│       ├── BillingPage.jsx        # /dashboard/billing — тариф, платежи
│       └── SettingsPage.jsx       # /dashboard/settings — профиль, пароль, уведомления
```

---

## Логика авторизации

Контекст `AuthContext` хранит два поля:
- `isLoggedIn: boolean` — авторизован ли пользователь
- `user: object | null` — данные пользователя

**Функции:**
- `login(email, password)` — устанавливает моковые данные пользователя
- `register(name, email, password)` — регистрация с моковыми данными
- `logout()` — сбрасывает состояние

**Защита маршрутов:**  
Компонент `PrivateRoute` в App.jsx: если `isLoggedIn === false` → редирект на `/auth/login`.

---

## Логика доступа

| Возможность | Без регистрации | Авторизован | PRO-тариф |
|-------------|:-:|:-:|:-:|
| Редактор документа | ✅ | ✅ | ✅ |
| Скачать документ | ✅ | ✅ | ✅ |
| Сохранить в ЛК | ❌ | ✅ | ✅ |
| ЭЦП | ❌ | ✅ | ✅ |
| Организации | ❌ | ✅ | ✅ |
| ИИ-заполнение | ❌ | ❌ | ✅ |

---

## Маршруты

| Путь | Страница | Доступ |
|------|----------|--------|
| `/` | Главная (лендинг) | Все |
| `/editor` | Редактор документа | Все |
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

## Моковые данные (src/data/mockData.js)

Файл содержит:
- `mockUser` — текущий пользователь (тариф PRO)
- `mockDocuments` — 5 документов разных статусов
- `mockOrganizations` — 2 организации (ООО и ИП)
- `mockPlans` — 3 тарифных плана (Бесплатно / Про / Бизнес)
- `mockPayments` — история платежей
- `mockDocumentFields` — поля документа (автоопределённые)
- `mockTestimonials` — отзывы клиентов

Всё это будет заменено на API-запросы при подключении бэкенда.

---

## Схема базы данных (Supabase / PostgreSQL)

Готовый SQL-скрипт: **[SQL.md](./SQL.md)**

### Таблицы

| Таблица | PK | Связи | Описание |
|---------|-----|-------|----------|
| `profiles` | `id` (FK → `auth.users`) | — | Профиль пользователя: имя, телефон, аватар, тариф (`free`/`pro`/`business`), счётчик документов |
| `organizations` | `uuid` | `user_id → auth.users` | Организации (ООО/ИП): реквизиты (ИНН, КПП, ОГРН) + банковские данные |
| `documents` | `uuid` | `user_id → auth.users`, `organization_id → organizations` | Документы PDF/DOCX: статус (`draft`/`filled`/`signed`), путь к файлу в Storage |
| `document_fields` | `uuid` | `document_id → documents` | Поля документа (ключ-значение): группа (`organization`/`contractor`/`other`), тип (`text`/`date`/`number`) |
| `payments` | `uuid` | `user_id → auth.users` | История платежей: тариф, сумма, статус (`success`/`pending`/`failed`) |

### Вспомогательные функции

| Функция | Возвращает | Назначение |
|---------|-----------|------------|
| `current_user_id()` | `uuid` | Алиас для `auth.uid()` |
| `current_user_plan()` | `text` | Тариф текущего пользователя |
| `has_plan(text[])` | `boolean` | Проверка тарифа (например `has_plan(ARRAY['pro','business'])`) |
| `handle_updated_at()` | trigger | Автообновление `updated_at` |
| `handle_new_user()` | trigger | Создание профиля при регистрации |
| `handle_docs_used_counter()` | trigger | Обновление счётчика `docs_used` в профиле |

### Ключевые архитектурные решения БД

- **RLS включён на всех таблицах** — анонимный пользователь не имеет доступа к данным в БД.
- **`payments` INSERT только через `service_role`** — платёж создаётся бэкендом после подтверждения платёжного шлюза.
- **`docs_used` обновляется триггером** — автоматически при INSERT/DELETE в `documents`.
- **ИИ-заполнение** — проверка тарифа `has_plan(ARRAY['pro','business'])` на уровне API-endpoint, не RLS.
- **`organization_id` при INSERT в `documents`** — RLS проверяет, что организация принадлежит тому же пользователю.
