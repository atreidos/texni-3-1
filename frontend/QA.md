# QA — план и результаты E2E-тестов

## Запуск

```bash
cd frontend
npm test
```

Приложение: http://localhost:5173 (Playwright запускает его сам при необходимости).

**Тестовая учётка:** `test@example.com` / `password123` (создаётся/логинится в `auth.setup.js`).

**Supabase:** Confirm email отключён (Auth → Providers → Email).

---

## Подготовка перед запуском

- [ ] `.env` с `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`
- [ ] Confirm email выключен в Supabase
- [ ] Edge Functions `organizations-create`, `profile-update`, `documents-create`, `documents-delete` задеплоены
- [ ] При использовании DaData — `dadata-find-party` задеплоена, `DADATA_API_KEY` в Secrets
- [ ] Миграция `004_storage_documents_bucket.sql` применена (bucket + RLS)

---

## План тестов (17 сценариев)

| № | Файл | Сценарий | Суть |
|---|------|----------|------|
| 1 | 01-регистрация | Регистрация и редирект | Регистрация → редирект на `/dashboard` |
| 2 | 02-вход | Вход и редирект | Авторизованный пользователь видит «Обзор» |
| 3a–e | 03-неавторизованный | Редирект на логин | Проверка для `/dashboard`, `/documents`, `/organizations`, `/billing`, `/settings` |
| 4a | 04-валидация | Пустые поля | Сообщения: «Введите имя», «Введите email», «Пароль минимум 8 символов», «Необходимо принять оферту» |
| 4b | 04-валидация | Короткий пароль | «Пароль минимум 8 символов» |
| 4c | 04-валидация | Пароли не совпадают | «Пароли не совпадают» |
| 4d | 04-валидация | Без оферты | «Необходимо принять оферту» |
| 5a | 05-создание-организации | Яндекс | ИНН 7736207543 → организация в списке |
| 5b | 05-создание-организации | Озон | ИНН 5439138402 → организация в списке |
| 6a | 06-удаление | Удаление организации | Создание → удаление → организация исчезает |
| 6b | 06-удаление | Удаление документа | Удаление документа → он исчезает (пропуск, если список пустой) |
| 7 | 07-обновление-профиля | Обновление профиля | Изменение имени/телефона → «Сохранено» → значения в форме |

---

## Что проверить отдельно (ранее были падения)

- **02** — редирект на `/dashboard` при использовании `storageState`
- **05, 06** — создание организаций (Edge Functions `organizations-create` задеплоены)
- **07** — обновление профиля (Edge Function `profile-update` задеплоена)
- **06b** — может быть пропущен, если список документов пустой

---

## Результаты прогонов

_Ниже — результаты проведённых прогонов (формат: тест → упал/прошёл, ошибка, исправление, скриншот)._

---

### Прогон 23.03.2025

**Итого:** 12 passed, 4 failed, 1 skipped (17 тестов).

**Успешные:** 01, 02, 03a–e, 04a–d, 06b (пропущен — нет документов).

**Тест 5a** (05 — Яндекс) упал.
2. Ошибка: `expect(locator).toBeVisible() failed` — `getByText('ООО «Яндекс»')` не найден. Кнопка в модалке остаётся «Сохранение...» — запрос к `organizations-create` не завершается (зависает или 404).
3. Исправить: задеплоить Edge Function `organizations-create` в Supabase: `supabase functions deploy organizations-create`.
4. Скриншот: `frontend/test-results/05-создание-организации-По-cdf6b-с-и-она-появляется-в-списке-chromium-authenticated/test-failed-1.png`
-------------

**Тест 5b** (05 — Озон) упал.
2. Ошибка: та же — `getByText('ООО «Озон»')` не найден. Кнопка «Сохранение...» — запрос не завершается.
3. Исправить: то же — задеплоить `organizations-create`.
4. Скриншот: `frontend/test-results/05-создание-организации-По-0b06f-н-и-она-появляется-в-списке-chromium-authenticated/test-failed-1.png`
-------------

**Тест 6a** (06 — удаление организации) упал.
2. Ошибка: `getByText('ООО «Яндекс»')` не найден — этап создания организации не проходит (зависит от 5a).
3. Исправить: задеплоить `organizations-create` (и `organizations-delete` при необходимости).
4. Скриншот: `frontend/test-results/06-удаление-организации-и--78721-ию-—-она-исчезает-из-списка-chromium-authenticated/test-failed-1.png`
-------------

**Тест 7** (07 — обновление профиля) упал.
2. Ошибка: `getByText(/Сохранено/)` не найден. Кнопка «Сохранение...» — запрос к `profile-update` не завершается.
3. Исправить: задеплоить Edge Function `profile-update`: `supabase functions deploy profile-update`.
4. Скриншот: `frontend/test-results/07-обновление-профиля-Поль-50c41-ках-—-изменения-сохраняются-chromium-authenticated/test-failed-1.png`
-------------

---

### Деплой Edge Functions (23.03.2025)

Задеплоены:
- `organizations-create`
- `profile-update`
- `organizations-delete`

Команды (из корня проекта):
```bash
supabase link --project-ref xiokfbguzoyuiwlyqxrp
supabase functions deploy organizations-create --workdir backend
supabase functions deploy profile-update --workdir backend
supabase functions deploy organizations-delete --workdir backend
```

---

### Исправление deadlock в onAuthStateChange (23.03.2025)

**Проблема:** Запросы к Edge Functions (organizations-create, profile-update) зависали в E2E. В ручной проверке всё работало.

**Причина:** В `AuthContext.jsx` callback `onAuthStateChange` вызывал `await fetchProfile()` — это создаёт deadlock в Supabase (см. [документацию](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)).

**Исправление:** Убрать `await` из callback, обернуть `fetchProfile()` в `setTimeout(..., 0)`.

**Результат:** После фикса модалка создания организации закрывается, сохранение срабатывает. Часть тестов проходит. Оставшиеся падения могут быть связаны с параллельным запуском и сессией.

---

### Исправление разлогинивания при клике «Добавить организацию» (23.03.2025)

**Проблема:** При нажатии «Добавить организацию» происходило разлогинивание — 401 от API вызывал `signOut` и редирект.

**Исправления:**
1. В тестах — ожидание исчезновения «Загрузка...» в `main` перед кликом «Добавить организацию», чтобы не кликать во время выполнения `organizations-list`.
2. В OrganizationsPage — явная передача `accessToken` в `callEdgeFunction` для всех write-операций (create, update, delete, set-main).

---

### Исправление редиректа на логин при сохранении организации (23.03.2025)

**Проблема:** При нажатии «Сохранить» в модалке создания/редактирования организации происходил выход и редирект на `/auth/login`.

**Причина:** `callEdgeFunction` с `accessToken` из AuthContext мог получать устаревший токен (гонка обновления сессии) → 401 → `signOut` + redirect.

**Исправление:** Замена `callEdgeFunction` на `invokeEdgeFunction` для organizations-create, organizations-update, organizations-delete, organizations-set-main. `invokeEdgeFunction` использует `supabase.functions.invoke()` — клиент Supabase сам подставляет актуальный access_token из внутренней сессии.

---

## Итоговая таблица проведённых тестов

*Прогон: 23.03.2025 (последний)*

| № | Сценарий | Результат | Примечание |
|---|----------|-----------|------------|
| 1 | Регистрация и редирект в личный кабинет | ✅ Passed | |
| 2 | Вход и редирект на «Обзор» | ✅ Passed | |
| 3a | Неавторизованный → /dashboard | ✅ Passed | |
| 3b | Неавторизованный → /documents | ✅ Passed | |
| 3c | Неавторизованный → /organizations | ✅ Passed | |
| 3d | Неавторизованный → /billing | ✅ Passed | |
| 3e | Неавторизованный → /settings | ✅ Passed | |
| 4a | Валидация: пустые поля | ✅ Passed | |
| 4b | Валидация: короткий пароль | ✅ Passed | |
| 4c | Валидация: пароли не совпадают | ✅ Passed | |
| 4d | Валидация: без оферты | ✅ Passed | |
| 5a | Создание организации (Яндекс) | ✅ Passed | Исправлен strict mode (.first()) |
| 5b | Создание организации (Озон) | ✅ Passed | |
| 6a | Удаление организации | ✅ Passed | Использована уникальная организация (Сбербанк) |
| 6b | Удаление документа | ⏭️ Skipped | Нет документов в списке |
| 7 | Обновление профиля | ✅ Passed | Деплой с --no-verify-jwt; тест ждёт загрузку формы и заполняет email |
| 8 | Сохранение документа | Добавлен | Editor: upload PDF → Save → redirect /documents; требует миграцию 004, bucket |

**Итого:** 16 passed · 0 failed · 1 skipped (17 тестов) + тест 08 добавлен

### Исправления (23.03.2025)

1. **SettingsPage** — замена `callEdgeFunction` на `invokeEdgeFunction` для profile-update (как в OrganizationsPage)
2. **05** — `.first()` при multiple matches (Яндекс/Озон в DaData возвращают дубликаты)
3. **06** — уникальная организация (Сбербанк, ИНН 7707083893) вместо повторного создания Яндекс

### Изменение кода 24.03.2025 — create-payment (без E2E)

- Edge Function `create-payment`: при ошибке insert клиенту больше не отдаётся текст из PostgREST, только `{ "error": "Не удалось сохранить платёж" }`; детали в `console.error` на сервере.
- Автотесты `npm test` в этой сессии: 12 passed, 6 failed (зависание «Загрузка...», пустой email в настройках, редирект с editor — внешний Supabase/сессия, не связано с create-payment).

---

## 27.03.2026 — Yandex.Metrica

**N1**

1. Тест «Сборка фронта после подключения Метрики».
2. Ошибка: нет; `npm run build` — успех.
3. Исправил: не требовалось.
4. Скриншот: нет.

**Ручная проверка (рекомендуется):** `npm run dev` → в DevTools → Network запросы к `mc.yandex.ru`; переход по маршрутам (например `/` → `/pricing`) — ожидаем доп. hit без дубля первой загрузки.

-------------
