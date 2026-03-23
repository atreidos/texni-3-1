// Сценарий 3: Пользователь без авторизации не видит защищённые разделы
import { test, expect } from '@playwright/test';

const protectedPaths = [
  '/dashboard',
  '/dashboard/documents',
  '/dashboard/organizations',
  '/dashboard/billing',
  '/dashboard/settings',
];

for (const path of protectedPaths) {
  test(`Неавторизованный пользователь при переходе на ${path} попадает на /auth/login`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByPlaceholder('ivan@example.com')).toBeVisible();
  });
}
