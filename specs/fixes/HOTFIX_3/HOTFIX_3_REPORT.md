# HOTFIX 3 — отчёт

## Что изменено

- Акцент переведён на Fluent blue (`#0f6cbd`) с отдельными токенами hover, active, focus и белым текстом кнопок.
- Главное меню стало компактной центральной вертикальной карточкой: приветствие, описание, две карточки статистики, выбор уровня и четыре полноширинные кнопки.
- Выбор режима получил такую же вертикальную структуру без широких колонок.
- Лидерборд и информация теперь открываются в общем modal-компоненте поверх меню.
- Общий modal поддерживает закрытие по кнопке, Esc и backdrop, focus trap и возврат фокуса на открывший элемент.
- Тема React передаётся в активную Phaser-сцену без restart; обновляются canvas, календарная сетка, границы, подписи, блоки и tutorial popup.
- Внутриигровые HUD, пауза, победа, поражение и уведомление о кофе используют общие theme/accent CSS-токены.

## Изменённые файлы

- `src/styles/variables.css`
- `src/styles/global.css`
- `src/components/MainMenu.tsx`
- `src/components/MainMenu.module.css`
- `src/components/ModeSelect.tsx`
- `src/components/Modal.tsx`
- `src/components/Modal.module.css`
- `src/components/SettingsModal.tsx`
- `src/components/Leaderboard.tsx`
- `src/components/InfoScreen.tsx`
- `src/components/GameCanvas.tsx`
- `src/components/GameHud.module.css`
- `src/app/App.tsx`
- `src/game/config/theme.ts`
- `src/game/config/gameConfig.ts`
- `src/game/scenes/GameScene.ts`
- `src/game/scenes/BootScene.ts`
- `src/game/objects/CalendarGrid.ts`
- `src/game/objects/MeetingBlock.ts`
- `tests/e2e/app.spec.ts`

## Как тестировать

1. На главном экране переключить светлую и тёмную темы, проверить голубые состояния кнопок и вертикальную карточку.
2. Открыть лидерборд и информацию, закрыть их через Esc, крестик и клик по затемнению; фокус возвращается на исходную кнопку.
3. Нажать «Играть», проверить вертикальный выбор режимов и кнопку «Назад».
4. Во время игры открыть настройки, выбрать светлую тему и сохранить: canvas получает `data-theme="light"` без restart.
5. Проверить светлые HUD, паузу, результат и уведомление о кофе.

## На что обратить внимание

- Phaser использует тот же `settings.theme`, что и React: отдельное состояние темы внутри сцены не сохраняется.
- Смена темы обновляет существующий календарь и блоки, а новые объекты берут текущую тему из registry.
- Общий modal применяется к настройкам, лидерборду и информации; onboarding остаётся отдельным последовательным сценарием.

## Проверки

- `npm run test` — OK, 57/57
- `npm run lint` — OK
- `npm run build` — OK
- `npm run test:e2e` — OK, 9/9

## Известные ограничения

- Vite предупреждает о крупном Phaser-чанке; это не влияет на работу приложения.
