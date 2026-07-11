import { expect, test } from '@playwright/test';

test('opens the calendar level and launches the ball', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Meeting Breaker' }),
  ).toBeVisible();
  await expect(page.getByLabel('Игровое поле')).toBeVisible();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('data-scene', 'GameScene');
  await expect(canvas).toHaveAttribute('data-calendar-ready', 'true');
  await expect(canvas).toHaveAttribute('data-meeting-count', '21');
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready');

  await page.keyboard.down('Space');
  await expect(canvas).toHaveAttribute('data-ball-state', 'launched');
  await page.keyboard.up('Space');
  expect(browserErrors).toEqual([]);
});

test('supports keyboard movement, mouse movement and click launch', async ({
  page,
}) => {
  await page.goto('/');

  const canvas = page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready');
  const initialPaddleX = Number(await canvas.getAttribute('data-paddle-x'));

  await page.keyboard.down('ArrowRight');
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-paddle-x')))
    .toBeGreaterThan(initialPaddleX);
  await page.keyboard.up('ArrowRight');

  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();

  if (!bounds) {
    return;
  }

  await page.mouse.move(
    bounds.x + bounds.width * 0.75,
    bounds.y + bounds.height * 0.75,
  );
  await page.mouse.move(
    bounds.x + bounds.width * 0.25,
    bounds.y + bounds.height * 0.75,
    { steps: 5 },
  );
  await expect
    .poll(async () => Number(await canvas.getAttribute('data-paddle-x')))
    .toBeLessThan(initialPaddleX);

  await page.mouse.down({ button: 'left' });
  await expect(canvas).toHaveAttribute('data-ball-state', 'launched');
  await page.mouse.up({ button: 'left' });
});
