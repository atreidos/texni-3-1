# TODO

## Edge Functions — деплой после правок в коде

Выполняется вручную (нужны `supabase login` и привязка проекта). Из **корня репозитория**:

```bash
supabase link --project-ref <ваш-project-ref>
```

Разом все функции, где менялись валидация / `_shared` (март 2025):

```bash
supabase functions deploy organizations-create organizations-update organizations-delete organizations-set-main organizations-list profile-get profile-update documents-list documents-create documents-delete dadata-find-party payments-list create-payment --workdir backend
```

При 401 на шлюзе для отдельных функций — добавьте `--no-verify-jwt` к имени функции (см. README, SECURITY.md).

- [x] **Деплой Edge Functions** — выполнено (все перечисленные функции задеплоены на связанный проект Supabase). При следующих правках в `backend/supabase/functions/` снова запустите команду из блока выше.

---

## Безопасность (рекомендации)

- [x] **Rate limit** — настроить ограничения для Login, Sign up, Password reset ✓
- [x] **npm audit** — периодически запускать и устранять критические уязвимости ✓

- [ ] **HTTP Security Headers** — Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security
  - Где: конфиг хостинга (Vercel: vercel.json или Dashboard; Netlify: _headers или netlify.toml; nginx: server { add_header ... })

---

## Sentry

- [ ] **VITE_SENTRY_DSN** — добавьте в `frontend/.env` DSN из Sentry (Client Keys). Без переменной SDK не активен.
- [ ] **Source maps в Sentry (опционально)** — для читаемых стеков в production: `@sentry/vite-plugin`, org/project и `SENTRY_AUTH_TOKEN` в CI (не коммитить токен).
