import type {
  CalendarLayout,
  MeetingRectangle,
} from '../types/calendar';
import { WORK_DAYS, type MeetingBlockConfig } from '../types/meeting';

export const WORK_DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'] as const;
export const CALENDAR_STEP_MINUTES = 30;

export const DEFAULT_CALENDAR_LAYOUT: CalendarLayout = {
  x: 100,
  y: 78,
  width: 1080,
  height: 468,
  startMinutes: 9 * 60,
  endMinutes: 18 * 60,
  columnGap: 6,
  minMeetingHeight: 16,
};

export function calculateCalendarColumnWidth(
  layout: CalendarLayout,
): number {
  return (
    (layout.width - layout.columnGap * (WORK_DAYS.length - 1)) /
    WORK_DAYS.length
  );
}

export function calendarMinutesToY(
  minutes: number,
  layout: CalendarLayout,
): number {
  const calendarDuration = layout.endMinutes - layout.startMinutes;
  return (
    layout.y +
    ((minutes - layout.startMinutes) / calendarDuration) * layout.height
  );
}

export function calculateMeetingRect(
  meeting: MeetingBlockConfig,
  calendarLayout: CalendarLayout,
): MeetingRectangle {
  const dayIndex = WORK_DAYS.indexOf(meeting.day);

  if (dayIndex < 0) {
    throw new Error(`Unknown work day: ${meeting.day as string}`);
  }

  if (meeting.durationMinutes <= 0) {
    throw new Error(`Meeting ${meeting.id} must have a positive duration`);
  }

  const meetingEnd = meeting.startMinutes + meeting.durationMinutes;

  if (
    meeting.startMinutes < calendarLayout.startMinutes ||
    meetingEnd > calendarLayout.endMinutes
  ) {
    throw new Error(`Meeting ${meeting.id} is outside calendar working hours`);
  }

  const columnWidth = calculateCalendarColumnWidth(calendarLayout);
  const calendarDuration =
    calendarLayout.endMinutes - calendarLayout.startMinutes;
  const naturalHeight =
    (meeting.durationMinutes / calendarDuration) * calendarLayout.height;

  return {
    x:
      calendarLayout.x +
      dayIndex * (columnWidth + calendarLayout.columnGap),
    y: calendarMinutesToY(meeting.startMinutes, calendarLayout),
    width: columnWidth,
    height: Math.max(naturalHeight, calendarLayout.minMeetingHeight),
  };
}

export function formatCalendarTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${remainingMinutes
    .toString()
    .padStart(2, '0')}`;
}
