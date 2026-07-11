import { describe, expect, it } from 'vitest';
import { MeetingDurability } from './meetingDurability';

describe('MeetingDurability', () => {
  it('reduces HP by the incoming damage', () => {
    const durability = new MeetingDurability(3);

    expect(durability.damage().currentHp).toBe(2);
  });

  it('never allows HP below zero', () => {
    const durability = new MeetingDurability(2);

    durability.damage(10);

    expect(durability.currentHp).toBe(0);
  });

  it('marks destruction when HP reaches zero', () => {
    const durability = new MeetingDurability(1);

    expect(durability.damage().destroyedNow).toBe(true);
    expect(durability.destroyed).toBe(true);
  });

  it('reports destruction only once so reward cannot be duplicated', () => {
    const durability = new MeetingDurability(1);

    expect(durability.damage().destroyedNow).toBe(true);
    expect(durability.damage().destroyedNow).toBe(false);
  });
});
