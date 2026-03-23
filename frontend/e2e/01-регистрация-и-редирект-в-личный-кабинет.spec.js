// Сценарий 1: Пользователь регистрируется и попадает в личный кабинет
import { test, expect } from '@playwright/test';

test('Пользователь регистрируется и попадает в личный кабинет', async ({ page }) => {
  const timestamp = Date.now();
  const email = `test-${timestamp}@example.com`;

  await page.goto('/auth/register');

  await page.getByPlaceholder('Иван Петров').fill('Тестовый Пользователь');
  await page.getByPlaceholder('ivan@example.com').fill(email);
  await page.getByPlaceholder('Минимум 8 символов').fill('password123');
  await page.getByPlaceholder('••••••••').fill('password123');
  await page.locator('label').filter({ hasText: /принимаю/ }).locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.getByRole('heading', { name: 'Обзор' })).toBeVisible();
});
