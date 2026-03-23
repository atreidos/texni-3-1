// Хелпер для авторизации тестового пользователя
// Сначала пробует войти. Если не получилось — регистрирует пользователя (test@example.com, password123).
// Требует: Confirm email отключён в Supabase (Auth → Providers → Email).
export const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
};

export async function login(page) {
  await page.goto('/auth/login');
  await page.getByPlaceholder('ivan@example.com').fill(TEST_USER.email);
  await page.getByPlaceholder('••••••••').first().fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();

  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    return;
  } catch {
    // Вход не удался — регистрируем пользователя
  }

  await page.goto('/auth/register');
  await page.getByPlaceholder('Иван Петров').fill(TEST_USER.name);
  await page.getByPlaceholder('ivan@example.com').fill(TEST_USER.email);
  await page.getByPlaceholder('Минимум 8 символов').fill(TEST_USER.password);
  await page.getByPlaceholder('••••••••').fill(TEST_USER.password);
  await page.locator('label').filter({ hasText: /принимаю/ }).locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();

  try {
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    return;
  } catch {
    // Регистрация не удалась — возможно, пользователь уже есть, логин снова
  }

  const hasError = await page.locator('text=/already|уже|зарегистрирован|User already/i').isVisible().catch(() => false);
  if (hasError) {
    await page.goto('/auth/login');
    await page.getByPlaceholder('ivan@example.com').fill(TEST_USER.email);
    await page.getByPlaceholder('••••••••').first().fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    return;
  }

  throw new Error('Не удалось войти или зарегистрировать тестового пользователя');
}
