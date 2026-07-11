import { describe, expect, it } from 'vitest';
import type { CalendarLayout } from '../types/calendar';
import type { MeetingBlockConfig } from '../types/meeting';
import {
  calculateCalendarColumnWidth,
  calculateMeetingRect,
} from './calendarLayout';

const layout: CalendarLayout = {
  x: 100,
  y: 60,
  width: 1020,
  height: 540,
  startMinutes: 540,
  endMinutes: 1080,
  columnGap: 5,
  minMeetingHeight: 10,
};

function meeting(
  overrides: Partial<MeetingBlockConfig> = {},
): MeetingBlockConfig {
  return {
    id: 'test-meeting',
    typeId: 'daily',
    title: 'Test meeting',
    day: 'monday',
    startMinutes: 540,
    durationMinutes: 30,
    ...overrides,
  };
}

describe('calculateMeetingRect', () => {
  it('places Monday in the first column', () => {
    expect(calculateMeetingRect(meeting(), layout).x).toBe(layout.x);
  });

  it('places Friday in the fifth column', () => {
    const columnWidth = calculateCalendarColumnWidth(layout);
    const rectangle = calculateMeetingRect(
      meeting({ day: 'friday' }),
      layout,
    );

    expect(rectangle.x).toBe(
      layout.x + 4 * (columnWidth + layout.columnGap),
    );
  });

  it('places 09:00 at the top', () => {
    expect(calculateMeetingRect(meeting(), layout).y).toBe(layout.y);
  });

  it('places 17:30 on the final half-hour line', () => {
    expect(
      calculateMeetingRect(meeting({ startMinutes: 1050 }), layout).y,
    ).toBe(layout.y + 510);
  });

  it('scales a 15-minute meeting to one unit', () => {
    expect(
      calculateMeetingRect(meeting({ durationMinutes: 15 }), layout).height,
    ).toBe(15);
  });

  it('scales a 120-minute meeting to eight units', () => {
    expect(
      calculateMeetingRect(meeting({ durationMinutes: 120 }), layout).height,
    ).toBe(120);
  });
});
