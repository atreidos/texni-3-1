// Сценарий 2: Пользователь входит в аккаунт и попадает на страницу «Обзор»
// Использует storageState из auth.setup.js (тест уже авторизован).
import { test, expect } from '@playwright/test';

test('Пользователь входит в аккаунт и попадает на страницу «Обзор»', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Обзор' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Загрузить документ', exact: true })).toBeVisible();
});
