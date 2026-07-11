import { describe, expect, it } from 'vitest';
import { GAME_MODES } from '../types/mode';
import { EndlessMeetingGenerator } from './EndlessMeetingGenerator';

describe('EndlessMeetingGenerator', () => {
  it('uses only free slots and increases waves', () => {
    const generator = new EndlessMeetingGenerator(GAME_MODES.relax, () => 0.2);
    const occupied = [{ day: 'monday' as const, startMinutes: 540, durationMinutes: 30 }];
    const first = generator.createWave(occupied);
    const second = generator.createWave([...occupied, ...first.meetings]);
    expect(first.wave).toBe(1);
    expect(second.wave).toBe(2);
    expect(first.meetings).not.toContainEqual(expect.objectContaining({ day: 'monday', startMinutes: 540 }));
  });
});
