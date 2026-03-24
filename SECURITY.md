# Безопасность DocFlow

Рекомендации по настройке безопасности при развёртывании DocFlow.

---

## Rate limiting (Auth)

Supabase Auth не ограничивает количество попыток входа, регистрации и сброса пароля по умолчанию. Без rate limiting возможны атаки brute-force и credential stuffing.

**Что сделать:** Supabase Dashboard → **Authentication** → **Rate Limits** — настройте ограничения для:
- Login (signIn)
- Sign up (signUp)
- Password reset (resetPasswordForEmail)

Рекомендуется для production. Значения задаются в интерфейсе Supabase.

---

## RLS и anon key

`VITE_SUPABASE_ANON_KEY` — публичный ключ, через него можно обращаться к БД напрямую. Единственная защита — RLS-политики. Ошибка в политике может привести к утечке данных.

**Что сделать:**
- Убедитесь, что RLS включён на всех таблицах
- Проверьте политики: анонимные и чужие запросы должны возвращать пустые результаты или 401
- Тестируйте через PostgREST напрямую (Postman, curl с anon key)

---

## Переменные окружения

- **VITE_SHOW_ERRORS** — в production всегда `false` или не задана. Иначе пользователи видят стек-трейсы.
- **.env** — не коммитить, в `.gitignore` уже есть
- Секреты Edge Functions (SUPABASE_SERVICE_ROLE_KEY, DADATA_API_KEY и др.) — только в настройках Supabase, не в коде
- **DADATA_API_KEY** — API-ключ DaData хранится в Supabase Edge Functions Secrets. Никогда не передаётся на фронтенд. Все запросы к DaData идут через Edge Function `dadata-find-party`

---

## --no-verify-jwt и проверка JWT в Edge Functions

Флаг `--no-verify-jwt` отключает **только** проверку JWT на уровне шлюза Supabase. Проверка остаётся в коде функции.

- **Шлюз** (с verify_jwt): проверяет JWT до вызова функции. При миграции Supabase на новые JWT Signing Keys может возвращать «Invalid JWT» даже для валидных токенов.
- **Функция** (наш код): вызывает `supabase.auth.getUser(jwt)`. Невалидный/поддельный JWT → 401.

**Безопасность:** клиент не может подделать JWT (подпись знает только Supabase). Без валидного токена от Supabase Auth запрос всё равно завершится 401 внутри функции. `--no-verify-jwt` лишь переносит проверку со шлюза в код функции.

---

## CORS (Edge Functions)

CORS настраивается через секрет `CORS_ALLOWED_ORIGINS` (Supabase Dashboard → Project Settings → Edge Functions → Secrets).

- **Не задан или `*`** — `Access-Control-Allow-Origin: *` (любой сайт)
- **Задан список** — например `https://app.example.com,http://localhost:5173` (через запятую). Ответ содержит Origin только если он в списке.

Все Edge Functions используют `_shared/cors.ts`.

---

## Срок жизни JWT и refresh

Supabase выдаёт JWT на ~1 час. Проверьте в Supabase Dashboard → Auth → Settings:
- JWT expiry
- Refresh token rotation
- Поведение при истечении сессии (авто-refresh или logout)
