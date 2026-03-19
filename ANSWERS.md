# ANSWERS.md

- Добавлено правило БД: у одного пользователя может быть только одна "основная" организация (`organizations.is_main = true`). Реализовано частичным уникальным индексом в миграции `backend/supabase/migrations/002_organizations_one_main_per_user.sql`.
- Сортировка документов по дате (`updated_at`) для UI-выбора «Сначала новые / Сначала старые» не требует изменений в БД: текущая реализация меняет порядок на фронтенде после фильтрации.
- Полное разделение фронтенда и БД: фронтенд больше не использует `supabase.from(...)` для данных, а все чтение/запись идут через Edge Functions `/functions/v1/*`. Маппинг `snake_case <-> camelCase` выполняется на стороне Edge.
- Атомарная установка основной организации: добавлен Postgres RPC `public.set_organization_main(p_org_id uuid)` и Edge Function `organizations-set-main`, которая вызывает RPC, чтобы заменить два UPDATE на одну транзакцию.
- **401 при входе в организации / dashboard**: Исправлено переходом на `supabase.functions.invoke()` вместо ручного `fetch`. Клиент Supabase сам подставляет access_token и заголовки. Edge Functions profile-get, documents-list, organizations-list, payments-list теперь принимают и GET, и POST (invoke отправляет POST). **Нужно задеплоить Edge Functions**: `cd backend && supabase link` (если ещё не связан), затем `supabase functions deploy profile-get documents-list organizations-list payments-list`.

