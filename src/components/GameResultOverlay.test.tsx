import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { LevelResult } from '../game/types/game';
import { GameResultOverlay } from './GameResultOverlay';

const result: LevelResult = {
  score: 8_000,
  freedMinutes: 405,
  destroyedMeetings: 21,
  combo: 0,
  maxCombo: 7,
  multiplier: 1,
  coffeeSpent: 2,
  rating: 'Meeting Destroyer',
};

describe('GameResultOverlay', () => {
  it('renders complete victory statistics', () => {
    const html = renderToStaticMarkup(
      <GameResultOverlay
        outcome="victory"
        result={result}
        onRestart={() => undefined}
        onExit={() => undefined}
      />,
    );

    expect(html).toContain('Рабочая неделя спасена');
    expect(html).toContain('6 ч 45 мин');
    expect(html).toContain('Meeting Destroyer');
  });

  it('renders the required defeat message and actions', () => {
    const html = renderToStaticMarkup(
      <GameResultOverlay
        outcome="defeat"
        result={result}
        onRestart={() => undefined}
        onExit={() => undefined}
      />,
    );

    expect(html).toContain('Кофе закончился');
    expect(html).toContain('Встречи победили');
    expect(html).toContain('Заварить заново');
    expect(html).toContain('Закончить рабочую неделю');
  });
});
