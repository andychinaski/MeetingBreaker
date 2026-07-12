import { describe, expect, it } from 'vitest';
import { truncateMeetingTitle } from './meetingTitle';

describe('truncateMeetingTitle', () => {
  it('keeps titles that fit', () => expect(truncateMeetingTitle('Team Sync', 12)).toBe('Team Sync'));
  it('adds an ellipsis without exceeding the limit', () => {
    const result = truncateMeetingTitle('Very long planning meeting', 12);
    expect(result).toBe('Very long p…');
    expect(result).toHaveLength(12);
  });
});
