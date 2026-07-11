export interface CalendarLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  startMinutes: number;
  endMinutes: number;
  columnGap: number;
  minMeetingHeight: number;
}

export interface MeetingRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
