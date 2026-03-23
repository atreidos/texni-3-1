// Setup-тест: один раз регистрирует/логинит test@example.com и сохраняет storageState.
// Запускается перед проектом chromium-authenticated (webServer уже запущен).
import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, 'auth-storage.json');

const TEST_USER = { email: 'test@example.com', password: 'password123', name: 'Test User' };

setup('аутентификация тестового пользователя', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByPlaceholder('ivan@example.com').fill(TEST_USER.email);
  await page.getByPlaceholder('••••••••').first().fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();

  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  } catch {
    await page.goto('/auth/register');
    await page.getByPlaceholder('Иван Петров').fill(TEST_USER.name);
    await page.getByPlaceholder('ivan@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Минимум 8 символов').fill(TEST_USER.password);
    await page.getByPlaceholder('••••••••').fill(TEST_USER.password);
    await page.locator('label').filter({ hasText: /принимаю/ }).locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Создать аккаунт' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  }

  await page.context().storageState({ path: authFile });
});
