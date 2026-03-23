// Сценарий 7: Пользователь обновляет профиль в настройках — изменения сохраняются
// Использует storageState из auth.setup.js.
import { test, expect } from '@playwright/test';

test('Пользователь обновляет профиль в настройках — изменения сохраняются', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Настройки' }).click();
  await expect(page).toHaveURL(/\/dashboard\/settings/);

  const newName = `Тест ${Date.now()}`;
  const newPhone = '+79991234567';

  const profileForm = page.locator('form').first();
  await expect(profileForm.locator('input[type="email"]')).toHaveValue(/@/, { timeout: 10000 });
  await profileForm.locator('input[type="text"]').first().fill(newName);
  await profileForm.locator('input[type="tel"]').fill(newPhone);
  await profileForm.locator('input[type="email"]').fill('test@example.com');
  await profileForm.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByRole('button', { name: 'Сохранение...' })).not.toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/Сохранено/)).toBeVisible({ timeout: 5000 });
  await expect(profileForm.locator('input[type="text"]').first()).toHaveValue(newName, { timeout: 5000 });
  await expect(profileForm.locator('input[type="tel"]')).toHaveValue(newPhone);
});
