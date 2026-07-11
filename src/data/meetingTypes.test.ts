import { describe, expect, it } from 'vitest';
import { DEFAULT_LEVEL } from './levels';
import { getMeetingType, MEETING_TYPE_LIST } from './meetingTypes';

describe('meeting configuration', () => {
  it('defines all eight MVP meeting types', () => {
    expect(MEETING_TYPE_LIST).toHaveLength(8);
  });

  it('defines at least twenty meetings for the MVP level', () => {
    expect(DEFAULT_LEVEL.meetings.length).toBeGreaterThanOrEqual(20);
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
