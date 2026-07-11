import { describe, expect, it } from 'vitest';
import {
  calculateComboMultiplier,
  formatFreedTime,
  ScoreSystem,
} from './ScoreSystem';

describe('ScoreSystem', () => {
  it('adds score and freed time from a meeting', () => {
    const system = new ScoreSystem();
    const snapshot = system.registerMeetingDestroyed({
      score: 400,
      freedMinutes: 60,
    });

    expect(snapshot.score).toBe(400);
    expect(snapshot.freedMinutes).toBe(60);
    expect(snapshot.destroyedMeetings).toBe(1);
  });

  it('grows combo and remembers the maximum', () => {
    const system = new ScoreSystem();

    system.registerMeetingDestroyed({ score: 100, freedMinutes: 15 });
    system.registerMeetingDestroyed({ score: 100, freedMinutes: 15 });

    expect(system.snapshot.combo).toBe(2);
    expect(system.snapshot.maxCombo).toBe(2);
  });

  it('resets combo after a paddle hit', () => {
    const system = new ScoreSystem();

    system.registerMeetingDestroyed({ score: 100, freedMinutes: 15 });
    system.resetCombo();

    expect(system.snapshot.combo).toBe(0);
    expect(system.snapshot.maxCombo).toBe(1);
  });

  it('applies a multiplier to a long hit series', () => {
    const system = new ScoreSystem();

    for (let index = 0; index < 3; index += 1) {
      system.registerMeetingDestroyed({ score: 100, freedMinutes: 15 });
    }
    const fourth = system.registerMeetingDestroyed({
      score: 100,
      freedMinutes: 15,
    });

    expect(calculateComboMultiplier(4)).toBe(1.25);
    expect(fourth.score).toBe(425);
  });
});

describe('formatFreedTime', () => {
  it.each([
    [30, '30 мин'],
    [60, '1 ч'],
    [405, '6 ч 45 мин'],
  ])('formats %i minutes', (minutes, expected) => {
    expect(formatFreedTime(minutes)).toBe(expected);
  });
});
