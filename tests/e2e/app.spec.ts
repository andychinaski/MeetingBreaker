import { expect, test, type Page } from '@playwright/test';

async function startGame(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('meeting-breaker-profile')) {
      localStorage.setItem('meeting-breaker-profile', JSON.stringify({ version: 2, preferences: { playerName: 'Тестер', controlScheme: 'keyboard', tutorialCompleted: true }, settings: {}, progress: { unlockedLevelIds: ['calendar-overload'] }, leaderboard: [] }));
    }
  });
  await page.goto('/');
  await expect(page.getByLabel('Главное меню')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Играть' }).click();
  await page.getByRole('button', { name: /Прохождение/ }).click();
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready');
  return canvas;
}

test('first run validates the player and opens mode selection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Играть' }).click();
  const dialog = page.getByRole('dialog', { name: 'Первый запуск' });
  await expect(dialog.getByRole('button', { name: 'Далее' })).toBeDisabled();
  await dialog.getByLabel(/Имя игрока/).fill('  Алекс  ');
  await dialog.getByRole('button', { name: 'Далее' }).click();
  await dialog.getByText('Нет, сразу в календарь').click();
  await dialog.getByRole('button', { name: 'Далее' }).click();
  await dialog.getByText('Мышь').click();
  await dialog.getByRole('button', { name: 'Готово' }).click();
  await expect(page.getByRole('heading', { name: 'Как ломаем календарь?' })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});

test('opens the calendar level and launches the ball', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  const canvas = await startGame(page);

  await expect(
    page.getByRole('heading', { name: 'Meeting Breaker' }),
  ).toBeVisible();
  await expect(page.getByLabel('Игровое поле')).toBeVisible();
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
  const canvas = await startGame(page);
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
  const canvas = await startGame(page);
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
    page.getByRole('button', { name: 'Играть' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Играть' }).click();
  await page.getByRole('button', { name: /Прохождение/ }).click();
  await expect(canvas).toHaveAttribute('data-ball-state', 'ready');
  await expect(canvas).toHaveAttribute('data-paused', 'false');
});

test('coffee defeat supports scoring and restart', async ({ page }) => {
  const canvas = await startGame(page);

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

test('menu delays Phaser creation and persists settings', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('meeting-breaker-profile')) localStorage.setItem('meeting-breaker-profile', JSON.stringify({ version: 2, preferences: { playerName: 'Тестер', controlScheme: 'keyboard', tutorialCompleted: true }, settings: {}, progress: { unlockedLevelIds: ['calendar-overload'] }, leaderboard: [] })); });
  await page.goto('/');

  await expect(page.getByLabel('Главное меню')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.getByText('Лучший результат')).toBeVisible();

  await page.getByRole('button', { name: 'Настройки' }).click();
  const settingsDialog = page.getByRole('dialog');
  await expect(settingsDialog).toBeVisible();
  await settingsDialog.getByLabel('Звук включён').uncheck();
  await settingsDialog.getByLabel('Тема').selectOption('light');
  await settingsDialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await page.reload();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.getByLabel('Звук включён')).not.toBeChecked();
  await page.getByRole('button', { name: 'Отмена' }).click();

  await page.getByRole('button', { name: 'Играть' }).click();
  await page.getByRole('button', { name: /Прохождение/ }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.getByRole('button', { name: 'Пауза' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Закончить рабочую неделю' })
    .click();
  await expect(page.locator('canvas')).toHaveCount(0);

  await page.getByRole('button', { name: 'Играть' }).click();
  await page.getByRole('button', { name: /Прохождение/ }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('game fits target desktop sizes and browser zoom equivalents', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const canvas = await startGame(page);

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
    { width: 1093, height: 614 },
    { width: 1518, height: 853 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(canvas).toBeVisible();
    await expect(page.getByRole('button', { name: 'Пауза' })).toBeVisible();
    await expect
      .poll(async () => {
        const resizedBounds = await canvas.boundingBox();

        return Boolean(
          resizedBounds &&
            resizedBounds.x + resizedBounds.width <= viewport.width + 1 &&
            resizedBounds.y + resizedBounds.height <= viewport.height + 1,
        );
      })
      .toBe(true);
    const bounds = await canvas.boundingBox();
    expect(bounds).not.toBeNull();

    if (!bounds) {
      continue;
    }

    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(bounds.width / bounds.height).toBeCloseTo(16 / 9, 1);
  }
});
