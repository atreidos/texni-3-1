// Сценарий 6: Пользователь удаляет организацию или документ — запись исчезает из списка
// Использует storageState из auth.setup.js.
import { test, expect } from '@playwright/test';

test('Пользователь удаляет организацию — она исчезает из списка', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Организации' }).click();
  await expect(page.locator('main').getByText('Загрузка...')).not.toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Добавить организацию' }).click();

  const searchInput = page.getByPlaceholder('Название (ООО «Альфа») или ИНН');
  await searchInput.fill('7736207543');
  await page.getByRole('button', { name: 'Найти' }).click();

  const nameInput = page.getByPlaceholder('ООО «Название»');
  await page.waitForTimeout(3000);
  const currentName = await nameInput.inputValue();
  if (!currentName.trim()) {
    await nameInput.fill('ООО «Яндекс»');
    await page.getByPlaceholder('7701234567').fill('7736207543');
    await page.getByPlaceholder('770101001').fill('773601001');
    await page.getByPlaceholder('1027700132195').fill('1027739244742');
  }
  const orgName = (await nameInput.inputValue()) || 'ООО «Яндекс»';

  await page.getByRole('button', { name: 'Сохранить' }).first().click();
  await expect(page.getByRole('heading', { name: 'Добавить организацию' })).not.toBeVisible({ timeout: 20000 });
  const namePart = orgName.replace(/ООО\s*[«"']|["»']/g, '').trim();
  const orgCard = page.locator('.rounded-xl').filter({ hasText: new RegExp(namePart, 'i') }).first();
  await expect(orgCard).toBeVisible({ timeout: 10000 });

  // Удаляем организацию (кнопка с иконкой корзины — последняя в карточке)
  await orgCard.locator('button').last().click();

  await expect(orgCard).not.toBeVisible({ timeout: 5000 });
});

test('Пользователь удаляет документ — он исчезает из списка', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Документы' }).click();
  await expect(page).toHaveURL(/\/dashboard\/documents/);

  const rows = page.locator('table tbody tr');
  const count = await rows.count();

  if (count === 0) {
    test.skip(true, 'Нет документов для удаления — создайте документ через редактор');
  }

  const firstRow = rows.first();
  const firstDocName = await firstRow.locator('p.text-sm.font-medium').first().textContent();
  await firstRow.locator('button[title="Удалить"]').click();

  await expect(page.getByText(firstDocName)).not.toBeVisible({ timeout: 5000 });
});
