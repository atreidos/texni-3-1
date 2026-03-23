// Сценарий 4: Пользователь не может отправить форму регистрации с пустыми/невалидными полями
import { test, expect } from '@playwright/test';

test('Пустые поля — выводятся сообщения об ошибках', async ({ page }) => {
  await page.goto('/auth/register');
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(page.getByText('Введите имя')).toBeVisible();
  await expect(page.getByText('Введите email')).toBeVisible();
  await expect(page.getByText('Пароль минимум 8 символов')).toBeVisible();
  await expect(page.getByText('Необходимо принять оферту')).toBeVisible();
});

test('Короткий пароль — сообщение «Пароль минимум 8 символов»', async ({ page }) => {
  await page.goto('/auth/register');
  await page.getByPlaceholder('Иван Петров').fill('Иван');
  await page.getByPlaceholder('ivan@example.com').fill('test@example.com');
  await page.getByPlaceholder('Минимум 8 символов').fill('1234567');
  await page.getByPlaceholder('••••••••').fill('1234567');
  await page.locator('label').filter({ hasText: /принимаю/ }).locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(page.getByText('Пароль минимум 8 символов')).toBeVisible();
});

test('Пароли не совпадают — сообщение «Пароли не совпадают»', async ({ page }) => {
  await page.goto('/auth/register');
  await page.getByPlaceholder('Иван Петров').fill('Иван');
  await page.getByPlaceholder('ivan@example.com').fill('test@example.com');
  await page.getByPlaceholder('Минимум 8 символов').fill('password123');
  await page.getByPlaceholder('••••••••').fill('password456');
  await page.locator('label').filter({ hasText: /принимаю/ }).locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(page.getByText('Пароли не совпадают')).toBeVisible();
});

test('Без согласия с офертой — сообщение «Необходимо принять оферту»', async ({ page }) => {
  await page.goto('/auth/register');
  await page.getByPlaceholder('Иван Петров').fill('Иван');
  await page.getByPlaceholder('ivan@example.com').fill('test@example.com');
  await page.getByPlaceholder('Минимум 8 символов').fill('password123');
  await page.getByPlaceholder('••••••••').fill('password123');
  // чекбокс НЕ ставим
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  await expect(page.getByText('Необходимо принять оферту')).toBeVisible();
});
