// Сценарий 5: Пользователь создаёт организацию, она появляется в списке
// Использует storageState из auth.setup.js.
import { test, expect } from '@playwright/test';

async function createOrgAndWaitInList(page, inn, fallbackName) {
  await page.getByRole('button', { name: 'Найти' }).click();
  const nameInput = page.getByPlaceholder('ООО «Название»');
  await page.waitForTimeout(3000); // DaData или ручное заполнение
  const currentName = await nameInput.inputValue();
  if (!currentName.trim()) {
    await nameInput.fill(fallbackName);
    await page.getByPlaceholder('7701234567').fill(inn);
    await page.getByPlaceholder('770101001').fill(inn.length >= 10 ? inn.slice(0, 9) : inn + '0'.repeat(9 - inn.length));
    // ОГРН 13 цифр: для Яндекса 1027739244742, для Озон 1025400039248
    await page.getByPlaceholder('1027700132195').fill(inn === '5439138402' ? '1025400039248' : '1027739244742');
  }
  const orgName = (await nameInput.inputValue()) || fallbackName;

  await page.getByRole('button', { name: 'Сохранить' }).first().click();
  // Ждём закрытия модалки (успех) — затем имя в списке карточек (h3)
  await expect(page.getByRole('heading', { name: 'Добавить организацию' })).not.toBeVisible({ timeout: 20000 });
  const namePart = fallbackName.replace(/ООО\s*[«"']|["»']/g, '').trim();
  await expect(page.getByText(new RegExp(namePart, 'i')).first()).toBeVisible({ timeout: 10000 });
  return orgName;
}

test('Пользователь создаёт организацию (Яндекс) и она появляется в списке', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Организации' }).click();
  await expect(page).toHaveURL(/\/dashboard\/organizations/);
  // Ждём исчезновения «Загрузка...» в контенте — иначе при клике возможен 401 и разлогинивание
  await expect(page.locator('main').getByText('Загрузка...')).not.toBeVisible({ timeout: 20000 });

  await page.getByRole('button', { name: 'Добавить организацию' }).click();
  await expect(page.getByRole('heading', { name: 'Добавить организацию' })).toBeVisible();

  const searchInput = page.getByPlaceholder('Название (ООО «Альфа») или ИНН');
  await searchInput.fill('7736207543');
  await expect(page.getByRole('button', { name: 'Найти' })).toBeEnabled();
  await createOrgAndWaitInList(page, '7736207543', 'ООО «Яндекс»');
});

test('Пользователь создаёт организацию (Озон) и она появляется в списке', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Организации' }).click();
  await expect(page).toHaveURL(/\/dashboard\/organizations/);
  await expect(page.locator('main').getByText('Загрузка...')).not.toBeVisible({ timeout: 20000 });

  await page.getByRole('button', { name: 'Добавить организацию' }).click();

  const searchInput = page.getByPlaceholder('Название (ООО «Альфа») или ИНН');
  await searchInput.fill('5439138402');
  await expect(page.getByRole('button', { name: 'Найти' })).toBeEnabled();
  await createOrgAndWaitInList(page, '5439138402', 'ООО «Озон»');
});
