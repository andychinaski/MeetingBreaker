import { expect, test } from '@playwright/test';

test('opens the initialized application', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Meeting Breaker' }),
  ).toBeVisible();
  await expect(page.getByLabel('Игровое поле')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
});
