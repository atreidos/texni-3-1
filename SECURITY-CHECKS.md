# SECURITY-CHECKS — проверка безопасности после изменений

## 26.03.2026 — Sentry (@sentry/react)

| Проверка | Результат |
|----------|-----------|
| Секреты в .md / репозитории | Нет логинов/паролей; DSN в docs только как шаблон |
| VITE_SENTRY_DSN | Публичный browser DSN — ожидаемо в клиенте; не путать с Auth Token для загрузки карт |
| sendDefaultPii | false; в setUser только UUID (`id`) |
| Replay | maskAllText, blockAllMedia |
| Анонимные записи в БД | Не затронуто — только клиентский SDK |

## 23.03.2025 — Документы: загрузка, удаление, скачивание

| Проверка | Результат |
|----------|-----------|
| Storage RLS — путь `{user_id}/{doc_id}/{filename}` | ✅ INSERT/SELECT/DELETE только если первый сегмент = auth.uid() |
| documents-create — проверка file_path | ✅ filePath.split('/')[0] === user.id |
| documents-create — JWT | ✅ getUser(jwt), 401 при невалидном токене |
| documents-delete — удаление Storage | ✅ Файл удаляется только после проверки владельца (select) |
| Download — signed URL | ✅ Токен в запросе от сессии; RLS на Storage ограничивает доступ |
| Утечка credentials в md-файлы | ✅ Нет |

## 23.03.2025 — E2E тесты, SettingsPage, тесты 05/06

| Проверка | Результат |
|----------|-----------|
| Утечка credentials в md-файлы | ✅ Нет |
| invokeEdgeFunction в SettingsPage — токен из сессии | ✅ Корректно |
| Тестовые данные (ИНН, email) — только в тестах | ✅ test@example.com, ИНН организаций |
| FULL-QA.md, QA.md — секреты | ✅ Нет |

## 24.03.2025 — Финальный чеклист урока (аудит)

| Категория | Пункт | Статус |
|-----------|--------|--------|
| Авторизация | Приватные эндпоинты закрыты токеном (401) | ✅ Edge Functions: `Bearer` + `getUser(jwt)`; исключение: `create-payment` — без JWT (заглушка под платёжный webhook; **нельзя вызывать с клиента без доработки**) |
| Авторизация | Операции проверяют владельца (403) | ✅ Через RLS + выборки `.eq(..., user.id)` или select, видимый только своим (напр. organizations-delete, documents-create) |
| Авторизация | Rate limit на логин/регистрацию | ✅ Настроено в Supabase Dashboard → Authentication → Rate Limits |
| Валидация | Типы, длина, обязательность | ✅ Частично на Edge (UUID, строки, MIME, размер); формы на фронте (e2e 04) |
| Валидация | Ошибки с указанием поля | ✅ Edge 400: `{ error, field }` или `errors[]`; клиент `validationErrorsMap` |
| Данные | Параметризованные запросы / Supabase | ✅ Supabase client / RPC |
| Данные | XSS: текст не как HTML | ✅ React по умолчанию экранирует; `dangerouslySetInnerHTML` не используется |
| Секреты | Ключи в .env / Secrets | ✅ Фронт: VITE_* в `.env`; Edge: `Deno.env`; service role только на сервере |
| Секреты | `.env` в `.gitignore` | ✅ |
| Секреты | `.env.example` в репозитории | ✅ `frontend/.env.example` (шаблон без значений) |
| Секреты | Секреты не в логах / не в ответах клиенту | ✅ Подробности только в `console.error` на сервере; клиенту — короткое `{ error: "..." }` (create-payment исправлено 24.03.2025) |
| Сеть | CORS только фронтенд | ⚠️ По умолчанию `*` если не задан `CORS_ALLOWED_ORIGINS` — план: задать секрет в production |
| Сеть | HTTPS | ✅ Supabase API/хостинг по HTTPS; локально http — норма для dev |
| Сеть | Ошибки наружу кратко | ✅ В основном `{ error: "..." }` / 500 generic; см. исключение create-payment |
| Файлы | Размер / тип / имя / объектное хранилище | ✅ Bucket 50MB; RLS по `user_id`; путь `{user_id}/{docId}/{fileName}`; имя файла санитизируется при сохранении (`EditorPage`: небезопасные символы → `_`); проверки в documents-create + клиент `accept` |
| Тесты | Ключевые сценарии | ✅ Playwright e2e (регистрация, валидация, организации, документы, профиль) |
| Тесты | Тесты проходят | ✅ `npm test` — 18 passed (24.03.2025) |

## 24.03.2025 — create-payment: ответ клиенту без деталей БД

| Проверка | Результат |
|----------|-----------|
| При ошибке insert не отдаём `error.message` PostgREST клиенту | ✅ Короткий JSON `{ error: "Не удалось сохранить платёж" }`; детали в `console.error` |
