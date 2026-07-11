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
  await expect(canvas).toHaveAttribute('data-coffee-cups', '3');
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready');
  await expect(page.getByLabel('Игровая статистика')).toBeVisible();

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

test('pause stops timers and supports resume, R, restart and exit', async ({
  page,
}) => {
  await page.goto('/');

  const canvas = page.locator('canvas');
  const pauseButton = page.getByRole('button', { name: 'Пауза' });
  await pauseButton.click();
  await expect(canvas).toHaveAttribute('data-paused', 'true');

  let pauseDialog = page.getByRole('dialog');
  await expect(
    pauseDialog.getByRole('heading', { name: 'Пауза' }),
  ).toBeVisible();
  await pauseDialog.getByRole('button', { name: 'Продолжить' }).click();
  await expect(canvas).toHaveAttribute('data-paused', 'false');
  await expect(pauseDialog).toBeHidden();

  await page.keyboard.down('Space');
  await expect(canvas).toHaveAttribute('data-ball-state', 'launched');
  await page.keyboard.up('Space');
  await expect(canvas).toHaveAttribute('data-ball-state', 'resetting', {
    timeout: 6_000,
  });

  await page.keyboard.press('Escape');
  await expect(canvas).toHaveAttribute('data-paused', 'true');
  await page.waitForTimeout(1_000);
  await expect(canvas).toHaveAttribute('data-ball-state', 'resetting');

  await page.keyboard.press('Escape');
  await expect(canvas).toHaveAttribute('data-paused', 'false');
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready', {
    timeout: 2_000,
  });

  await page.keyboard.down('Space');
  await expect(canvas).toHaveAttribute('data-ball-state', 'launched');
  await page.keyboard.up('Space');
  await page.keyboard.press('r');
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready');
  await expect(canvas).toHaveAttribute('data-coffee-cups', '3');

  await page.getByRole('button', { name: 'Пауза' }).click();
  pauseDialog = page.getByRole('dialog');
  await pauseDialog.getByRole('button', { name: 'Начать заново' }).click();
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready');
  await expect(canvas).toHaveAttribute('data-paused', 'false');

  await page.getByRole('button', { name: 'Пауза' }).click();
  pauseDialog = page.getByRole('dialog');
  await pauseDialog
    .getByRole('button', { name: 'Закончить рабочую неделю' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Начать работу' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Начать работу' }).click();
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready');
  await expect(canvas).toHaveAttribute('data-paused', 'false');
});

test('coffee defeat supports scoring and restart', async ({ page }) => {
  await page.goto('/');

  const canvas = page.locator('canvas');

  const playUntilDefeat = async (verifyScore: boolean) => {
    await canvas.scrollIntoViewIfNeeded();
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();

    if (!bounds) {
      return;
    }

    await page.mouse.move(
      bounds.x + bounds.width * 0.36,
      bounds.y + bounds.height * 0.8,
    );
    await page.mouse.move(
      bounds.x + bounds.width * 0.33,
      bounds.y + bounds.height * 0.8,
      { steps: 3 },
    );

    for (const coffeeCups of [2, 1, 0]) {
      await expect(canvas).toHaveAttribute('data-ball-state', 'ready');
      await page.keyboard.down('Space');
      await expect(canvas).toHaveAttribute('data-ball-state', 'launched');
      await page.keyboard.up('Space');
      await expect(canvas).toHaveAttribute(
        'data-coffee-cups',
        coffeeCups.toString(),
        { timeout: 10_000 },
      );
    }

    await expect(canvas).toHaveAttribute('data-ball-state', 'game-over');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Кофе закончился', { exact: true })).toBeVisible();
    await expect(page.getByText('Встречи победили.', { exact: true })).toBeVisible();
    if (verifyScore) {
      await expect
        .poll(async () => Number(await canvas.getAttribute('data-score')))
        .toBeGreaterThan(0);
    }
  };

  await playUntilDefeat(true);
  await page.getByRole('button', { name: 'Заварить заново' }).click();
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready');
  await expect(canvas).toHaveAttribute('data-coffee-cups', '3');
});
