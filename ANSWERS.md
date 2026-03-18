# ANSWERS.md

- Добавлено правило БД: у одного пользователя может быть только одна "основная" организация (`organizations.is_main = true`). Реализовано частичным уникальным индексом в миграции `backend/supabase/migrations/002_organizations_one_main_per_user.sql`.

