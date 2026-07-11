import { describe, expect, it } from 'vitest';
import {
  ESPRESSO_DURATION_MS,
  PowerUpSystem,
} from './PowerUpSystem';

describe('PowerUpSystem', () => {
  it('requests an additional ball for Async Mode', () => {
    const system = new PowerUpSystem();

    expect(system.activate('async-mode', 0).asyncBallRequested).toBe(true);
  });

  it('consumes Decline exactly once', () => {
    const system = new PowerUpSystem();
    system.activate('decline', 0);

    expect(system.consumeDecline()).toBe(true);
    expect(system.consumeDecline()).toBe(false);
  });

  it('expires Espresso Shot after ten seconds', () => {
    const system = new PowerUpSystem();
    system.activate('espresso-shot', 1_000);

    expect(system.isEspressoActive(1_000 + ESPRESSO_DURATION_MS - 1)).toBe(true);
    expect(system.expireEspresso(1_000 + ESPRESSO_DURATION_MS)).toBe(true);
    expect(system.isEspressoActive(20_000)).toBe(false);
  });

  it('refreshes Espresso Shot without stacking it', () => {
    const system = new PowerUpSystem();
    system.activate('espresso-shot', 0);
    const refreshed = system.activate('espresso-shot', 5_000);

    expect(refreshed.espressoRefreshed).toBe(true);
    expect(system.getActiveTypes(5_000)).toEqual(['espresso-shot']);
    expect(system.isEspressoActive(14_999)).toBe(true);
    expect(system.isEspressoActive(15_000)).toBe(false);
  });
});
