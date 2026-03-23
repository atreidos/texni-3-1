# SECURITY-CHECKS — проверка безопасности после изменений

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
