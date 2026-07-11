import { describe, expect, it } from 'vitest';
import type { LevelResult } from '../game/types/game';
import {
  DEFAULT_PROFILE,
  loadProfile,
  recordLevelResult,
  STORAGE_KEY,
  updateSettings,
} from './storageService';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const result: LevelResult = {
  score: 2_500,
  freedMinutes: 180,
  destroyedMeetings: 8,
  combo: 0,
  maxCombo: 4,
  multiplier: 1,
  coffeeSpent: 1,
  rating: 'Focus Keeper',
};

describe('storageService', () => {
  it('returns defaults when storage is empty', () => {
    expect(loadProfile(new MemoryStorage())).toEqual(DEFAULT_PROFILE);
  });

  it('writes and reads settings', () => {
    const storage = new MemoryStorage();
    updateSettings(
      loadProfile(storage),
      { soundEnabled: false, volume: 0.25, theme: 'light' },
      storage,
    );

    expect(loadProfile(storage).settings).toEqual({
      soundEnabled: false,
      volume: 0.25,
      theme: 'light',
      musicEnabled: true,
      musicVolume: 0.45,
      meetingPalette: 'default',
      language: 'ru',
    });
  });

  it('recovers from corrupted JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{broken');

    expect(loadProfile(storage)).toEqual(DEFAULT_PROFILE);
  });

  it('stores records but not an active session', () => {
    const storage = new MemoryStorage();
    const updated = recordLevelResult(loadProfile(storage), result, storage);

    expect(updated.progress.bestScore).toBe(2_500);
    expect(updated.progress.maxFreedMinutes).toBe(180);
    expect(JSON.stringify(updated)).not.toContain('activePowerUps');
  });
});
