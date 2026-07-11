import { describe, expect, it } from 'vitest';
import { SpeedModifierSystem } from './SpeedModifierSystem';

describe('SpeedModifierSystem', () => {
  it('combines independent modifiers and caps the result', () => {
    const speed = new SpeedModifierSystem(400, 700);
    speed.set('mode', 1.2);
    speed.set('espresso', 0.75);
    speed.set('acceleration', 2);
    expect(speed.finalSpeed).toBe(700);
  });

  it('removes modifiers without changing the others', () => {
    const speed = new SpeedModifierSystem(400, 700);
    speed.set('mode', 1.2);
    speed.set('meeting-field', 0.5);
    speed.remove('meeting-field');
    expect(speed.finalSpeed).toBe(480);
  });
});
