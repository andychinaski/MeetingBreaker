import { describe, expect, it } from 'vitest';
import { LevelProgress } from './LevelProgress';

describe('LevelProgress', () => {
  it('completes after all required meetings are destroyed', () => {
    const progress = new LevelProgress(['one', 'two']);

    expect(progress.registerDestroyed('one', true)).toBe(false);
    expect(progress.registerDestroyed('two', true)).toBe(true);
  });

  it('ignores optional meetings', () => {
    const progress = new LevelProgress(['required']);

    expect(progress.registerDestroyed('optional', false)).toBe(false);
    expect(progress.remainingRequired).toBe(1);
  });

  it('reports completion only once', () => {
    const progress = new LevelProgress(['one']);

    expect(progress.registerDestroyed('one', true)).toBe(true);
    expect(progress.registerDestroyed('one', true)).toBe(false);
  });
});
