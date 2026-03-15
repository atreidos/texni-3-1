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

Где взять значения:
- Откройте [supabase.com](https://supabase.com) → ваш проект → **Settings → API**
- `VITE_SUPABASE_URL` — поле **Project URL**
- `VITE_SUPABASE_ANON_KEY` — поле **anon / public** в разделе Project API Keys

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
├── lib/
│   └── supabase.js          # Supabase client (singleton)
├── context/
│   └── AuthContext.jsx      # Auth state + profile из БД
├── components/              # Переиспользуемые компоненты
├── pages/
│   ├── auth/                # Вход, регистрация, восстановление пароля
│   └── dashboard/           # Личный кабинет (документы, орги, биллинг, настройки)
└── data/
    └── mockData.js          # Статические данные (тарифы, отзывы, поля редактора)
```
