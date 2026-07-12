import { describe, expect, it } from 'vitest';
import { getHudConfig } from './hudConfig';

describe('getHudConfig', () => {
  it('uses a level in campaign and a wave in endless modes', () => {
    expect(getHudConfig('campaign').context).toBe('level');
    expect(getHudConfig('relax').context).toBe('wave');
  });
  it('always hides coffee in Hard', () => expect(getHudConfig('hard').showCoffee).toBe(false));
});
