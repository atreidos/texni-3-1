# ANSWERS.md

- **Документы: загрузка, удаление, скачивание** — bucket `documents` в Supabase Storage (миграция 004). Путь `{user_id}/{doc_id}/{filename}`. RLS: INSERT/SELECT/DELETE только для своей папки. EditorPage Save: upload в Storage + documents-create. DocumentsPage: Download через createSignedUrl; Delete — удаление файла из Storage в Edge Function. Реальное заполнение реквизитов из содержимого файла не реализовано.
- Добавлено правило БД: у одного пользователя может быть только одна "основная" организация (`organizations.is_main = true`). Реализовано частичным уникальным индексом в миграции `backend/supabase/migrations/002_organizations_one_main_per_user.sql`.
- Сортировка документов по дате (`updated_at`) для UI-выбора «Сначала новые / Сначала старые» не требует изменений в БД: текущая реализация меняет порядок на фронтенде после фильтрации.
- Полное разделение фронтенда и БД: фронтенд больше не использует `supabase.from(...)` для данных, а все чтение/запись идут через Edge Functions `/functions/v1/*`. Маппинг `snake_case <-> camelCase` выполняется на стороне Edge.
- Атомарная установка основной организации: добавлен Postgres RPC `public.set_organization_main(p_org_id uuid)` и Edge Function `organizations-set-main`, которая вызывает RPC, чтобы заменить два UPDATE на одну транзакцию.
- **401 при входе в организации / dashboard**: Исправлено переходом на `supabase.functions.invoke()` вместо ручного `fetch`. Клиент Supabase сам подставляет access_token и заголовки. Edge Functions profile-get, documents-list, organizations-list, payments-list теперь принимают и GET, и POST (invoke отправляет POST). **Нужно задеплоить Edge Functions**: `cd backend && supabase link` (если ещё не связан), затем `supabase functions deploy profile-get documents-list organizations-list payments-list`.

## Авторизация и валидация (план доработок)

- **ForgotPasswordPage** — заглушка заменена на реальный вызов `supabase.auth.resetPasswordForEmail(email)`. RedirectTo: `/auth/reset-password`. Добавлена страница ResetPasswordPage для установки нового пароля после клика по ссылке из письма.
- **Политика паролей** — минимум 8 символов (было 6) на RegisterPage, SettingsPage (смена пароля), ResetPasswordPage.
- **Валидация email** — формат `[^\s@]+@[^\s@]+\.[^\s@]+` на LoginPage, RegisterPage, ForgotPasswordPage.
- **VITE_SHOW_ERRORS** — в production всегда `false`; показ ошибок разрешён только при `import.meta.env.DEV` и явном `VITE_SHOW_ERRORS=true`.
- **.env.example** — в репозитории `frontend/.env.example`: переменные без значений (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY; опционально VITE_SHOW_ERRORS закомментирован). .gitignore содержит `.env`.
- **Финальный чеклист безопасности урока (24.03.2025)** — сводка: см. `SECURITY-CHECKS.md` раздел «Финальный чеклист урока». Остаётся по желанию: явный `CORS_ALLOWED_ORIGINS` в prod; единый формат ошибок с полем `field`; защита `create-payment` под реальный webhook (сейчас заглушка).
- **Ошибки валидации «с указанием поля»** — реализовано: Edge Functions отдают JSON с `field` / `errors[]` (`_shared/validation-response.ts`); на фронте `validationErrorsMap` и подсветка полей в настройках профиля и в модалке организаций.
- **Переименование файла при сохранении** — в уроке обычно: не класть в Storage оригинальное имя как есть (опасные символы, `../`). В проекте уже сделано: в `EditorPage` имя для пути — `file.name.replace(/[^a-zA-Z0-9._-]/g, '_')`, путь `{user_id}/{doc_id}/{fileName}`. Дополнительно можно хранить под случайным именем (`${docId}.pdf`) — необязательно, если санитизация устраивает.
- **profile-update** Edge Function — серверная валидация: name (обязательно, ≤200), email (обязательно, формат, ≤254), phone (формат, ≤30, опционально).
- **organizations-create, organizations-update** Edge Functions — серверная валидация реквизитов: name, INN (10/12 цифр), OGRN (13/15 цифр), KPP (9 цифр, опц.), BIK (9 цифр, опц.), расчётный и корр. счёт (20 цифр, опц.) — согласовано с CHECK в БД.
- **403 для чужих данных**: documents-delete, organizations-delete, organizations-update, organizations-set-main перед операцией проверяют владельца через SELECT (RLS фильтрует чужие записи); при отсутствии доступа возвращают 403 и `{ error: "Доступ запрещён" }`.

## Интеграция DaData

- **dadata-find-party** — Edge Function-прокси к DaData API. Поиск по ИНН (findById/party) или по названию (suggest/party). Вызывается только авторизованными пользователями (JWT). API-ключ DaData хранится в Supabase Secrets (DADATA_API_KEY).
- **401 при поиске**: Шлюз Supabase мог отклонять JWT (ES256/HS256). dadata-find-party деплоится с `--no-verify-jwt`; проверка JWT выполняется внутри функции через `getUser()` — доступ без валидного токена по-прежнему запрещён.
- **Поиск по названию** — в форме организации добавлен блок «Поиск организации»: одно поле для названия или ИНН, кнопка «Найти». ИНН (10/12 цифр) → findById, иначе → suggest/party (первый результат). Кнопка «Заполнить фейковыми данными» и allowFakeOrgData удалены.
- Валидация ИНН на бэкенде: формат (10 или 12 цифр) + контрольная сумма по алгоритму ФНС. Запрос к DaData только после прохождения обоих уровней.
- Таймаут запроса к DaData — 7 секунд. При таймауте/ошибке возвращается 502, логируется ошибка. Основное действие (сохранение организации вручную) не блокируется.
- Логирование: каждый запрос и ответ логируется в Edge Function (requestId, inn, status, body). При ошибках — полный контекст для отладки.

## E2E тесты (Playwright)

- **auth.setup.js** — setup-проект: один раз логинит или регистрирует test@example.com (password123), сохраняет storageState в auth-storage.json. Тесты с авторизацией (02, 05, 06, 07) зависят от setup и используют этот storageState.
- **Регистрация вместо предсозданного пользователя**: при первом запуске выполнятся логин; если пользователя нет — регистрация (требует отключённого Confirm email в Supabase).
- **Создание организаций**: при отсутствии DaData (нет DADATA_API_KEY) тесты заполняют форму вручную по ИНН (Яндекс 7736207543, Озон 5439138402).
- **Разлогинивание при клике «Добавить организацию»**: 401 от organizations-list или profile-get вызывал signOut. Исправлено: (1) в тестах — ожидание загрузки списка перед кликом; (2) в OrganizationsPage — явная передача accessToken в callEdgeFunction.
- **Редирект на логин при сохранении организации**: callEdgeFunction с accessToken из AuthContext мог получать устаревший токен → 401 → signOut + redirect. Исправлено: заменён callEdgeFunction на invokeEdgeFunction для create/update/delete/set-main — Supabase client сам подставляет актуальный access_token из сессии.
- **«Сохранение заняло слишком долго»** при сохранении организации: таймаут 15 с был слишком мал для cold start Edge Function (30–60 с). Увеличен до 90 с, сообщение заменено на «Сервер долго запускается (cold start). Нажмите «Сохранить» ещё раз — повторный запрос обычно быстрее.»
- **Разлогинивание при сохранении**: (1) Возврат к callEdgeFunction с токеном из getSession() в момент вызова; (2) После create не вызывать fetchOrgs — добавлять созданную организацию из ответа; (3) При 401 после успешного refresh — не делать signOut, возвращать ошибку (возможна ошибка JWT gateway); (4) Деплой org-функций с --no-verify-jwt при 401 на gateway.
- **Invalid JWT**: gateway Supabase отклоняет JWT (Legacy vs новые Signing Keys). Добавлен `backend/supabase/config.toml` с `verify_jwt = false` для всех Edge Functions; JWT проверяется внутри функции через `getUser()`. Требуется переразвернуть функции после изменения config.

