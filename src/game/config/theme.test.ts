import { describe, expect, it } from 'vitest';
import { getGameTheme } from './theme';

describe('game theme', () => {
  it('provides distinct light canvas and readable calendar colors', () => {
    const dark = getGameTheme('dark');
    const light = getGameTheme('light');
    expect(light.canvas).not.toBe(dark.canvas);
    expect(light.label).not.toBe(light.mutedLabel);
  });
});
