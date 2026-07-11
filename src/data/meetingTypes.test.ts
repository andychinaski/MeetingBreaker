import { describe, expect, it } from 'vitest';
import { DEFAULT_LEVEL } from './levels';
import { getMeetingType, MEETING_TYPE_LIST } from './meetingTypes';

describe('meeting configuration', () => {
  it('keeps the MVP types and adds the post-MVP meeting set', () => {
    expect(MEETING_TYPE_LIST.length).toBeGreaterThanOrEqual(21);
  });

  it('keeps the first level deliberately small for early progression', () => {
    expect(DEFAULT_LEVEL.meetings).toHaveLength(10);
    expect(DEFAULT_LEVEL.meetings.every((meeting) => meeting.customHp === 1)).toBe(true);
  });

  it('uses only configured meeting types', () => {
    for (const meeting of DEFAULT_LEVEL.meetings) {
      expect(() => getMeetingType(meeting.typeId)).not.toThrow();
    }
  });

  it('keeps HP and rewards positive', () => {
    for (const meetingType of MEETING_TYPE_LIST) {
      expect(meetingType.maxHp).toBeGreaterThan(0);
      expect(meetingType.score).toBeGreaterThan(0);
      expect(meetingType.freedMinutes).toBeGreaterThan(0);
    }
  });
});
