export const GAME_EVENTS = {
  MEETING_DESTROYED: 'MEETING_DESTROYED',
} as const;

export interface MeetingDestroyedPayload {
  meetingId: string;
  typeId: string;
  score: number;
  freedMinutes: number;
  required: boolean;
}
