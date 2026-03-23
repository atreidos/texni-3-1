// Сценарий 8: Пользователь загружает файл в редакторе и сохраняет — документ появляется в списке
// Использует storageState из auth.setup.js.
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplePdfPath = path.join(__dirname, 'fixtures', 'sample.pdf');

test('Пользователь загружает документ и сохраняет — он появляется в списке', async ({ page }) => {
  await page.goto('/editor');
  await expect(page).toHaveURL(/\/editor/);

  // Ждём зону загрузки
  const uploadZone = page.getByText('Перетащите документ сюда');
  await expect(uploadZone).toBeVisible({ timeout: 5000 });

  // Загружаем файл через скрытый input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(samplePdfPath);

  // Ждём появления редактора (имя файла в тулбаре)
  await expect(page.getByText('sample.pdf')).toBeVisible({ timeout: 5000 });

  // Сохранить
  await page.getByRole('button', { name: 'Сохранить' }).click();

  // Ждём редиректа на документы
  await expect(page).toHaveURL(/\/dashboard\/documents/, { timeout: 15000 });

  // Документ в списке
  await expect(page.getByText('sample.pdf')).toBeVisible({ timeout: 5000 });
});
