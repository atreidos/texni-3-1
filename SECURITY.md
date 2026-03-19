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
- Секреты Edge Functions (SUPABASE_SERVICE_ROLE_KEY и др.) — только в настройках Supabase, не в коде

---

## CORS (Edge Functions)

По умолчанию CORS в Edge Functions настроен как `*` — любой сайт может инициировать запросы. Для production рекомендуется ограничить `Access-Control-Allow-Origin` списком разрешённых доменов.

---

## Срок жизни JWT и refresh

Supabase выдаёт JWT на ~1 час. Проверьте в Supabase Dashboard → Auth → Settings:
- JWT expiry
- Refresh token rotation
- Поведение при истечении сессии (авто-refresh или logout)
