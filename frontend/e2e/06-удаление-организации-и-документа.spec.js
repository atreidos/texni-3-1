// Сценарий 6: Пользователь удаляет организацию или документ — запись исчезает из списка
// Использует storageState из auth.setup.js.
import { test, expect } from '@playwright/test';

test('Пользователь удаляет организацию — она исчезает из списка', async ({ page }) => {
  // Используем уникальную организацию (Сбербанк), чтобы избежать дубликата с 05a/05b
  const inn = '7707083893';
  const fallbackName = 'ПАО «Сбербанк»';

  await page.goto('/');
  await page.getByRole('link', { name: 'Организации' }).click();
  await expect(page.locator('main').getByText('Загрузка...')).not.toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Добавить организацию' }).click();

  const searchInput = page.getByPlaceholder('Название (ООО «Альфа») или ИНН');
  await searchInput.fill(inn);
  await page.getByRole('button', { name: 'Найти' }).click();

  const nameInput = page.getByPlaceholder('ООО «Название»');
  await page.waitForTimeout(3000);
  const currentName = await nameInput.inputValue();
  if (!currentName.trim()) {
    await nameInput.fill(fallbackName);
    await page.getByPlaceholder('7701234567').fill(inn);
    await page.getByPlaceholder('770101001').fill('773601001');
    await page.getByPlaceholder('1027700132195').fill('1027700132195');
  }
  const orgName = (await nameInput.inputValue()) || fallbackName;

  await page.getByRole('button', { name: 'Сохранить' }).first().click();
  await expect(page.getByRole('heading', { name: 'Добавить организацию' })).not.toBeVisible({ timeout: 20000 });
  const namePart = orgName.replace(/ООО\s*[«"']|["»']|ПАО\s*[«"']?|["»']?/g, '').trim();
  const orgCard = page.locator('.rounded-xl').filter({ hasText: new RegExp(namePart, 'i') }).first();
  await expect(orgCard).toBeVisible({ timeout: 10000 });

  await orgCard.locator('button').last().click();

  await expect(orgCard).not.toBeVisible({ timeout: 5000 });
});

test('Пользователь удаляет документ — он исчезает из списка', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Документы' }).click();
  await expect(page).toHaveURL(/\/dashboard\/documents/);
  await expect(page.locator('main').getByText('Загрузка...')).not.toBeVisible({ timeout: 20000 });

  const rows = page.locator('table tbody tr');
  const countBefore = await rows.count();

  if (countBefore === 0) {
    test.skip(true, 'Нет документов для удаления — войдите как test@example.com и создайте документ через /editor');
  }

  await rows.first().locator('button[title="Удалить"]').click();

  await expect(page.locator('table tbody tr')).toHaveCount(countBefore - 1, { timeout: 5000 });
});
