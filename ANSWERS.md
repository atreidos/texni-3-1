# ANSWERS.md

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
- **.env.example** — создан в `frontend/.env.example` с заглушками VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_SHOW_ERRORS. .gitignore уже содержит `.env`.
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

