# TODO

## Безопасность (рекомендации)

- [x] **Rate limit** — настроить ограничения для Login, Sign up, Password reset ✓
- [x] **npm audit** — периодически запускать и устранять критические уязвимости ✓

- [ ] **HTTP Security Headers** — Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security
  - Где: конфиг хостинга (Vercel: vercel.json или Dashboard; Netlify: _headers или netlify.toml; nginx: server { add_header ... })
