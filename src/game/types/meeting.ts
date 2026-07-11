export const WORK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const;

export type WorkDay = (typeof WORK_DAYS)[number];

export type MeetingCategory =
  | 'daily'
  | 'sync'
  | 'planning'
  | 'refinement'
  | 'technical'
  | 'one-to-one'
  | 'useless'
  | 'all-hands'
  | 'status'
  | 'review'
  | 'training'
  | 'incident'
  | 'recurring'
  | 'retrospective'
  | 'stakeholder'
  | 'decision'
  | 'postmortem'
  | 'action-item'
  | 'preparation';

export type MeetingBehaviorId =
  | 'moving'
  | 'blinking'
  | 'recurring'
  | 'split'
  | 'shielded'
  | 'linked'
  | 'accelerating'
  | 'slow-field'
  | 'timed'
  | 'bonus-drop';

export interface MeetingType {
  id: string;
  title: string;
  shortTitle: string;
  category: MeetingCategory;
  color: string;
  colorToken?: string;
  maxHp: number;
  score: number;
  freedMinutes: number;
  dropChance: number;
  behaviorIds?: MeetingBehaviorId[];
  behaviorConfig?: Record<string, unknown>;
}

export interface MeetingBlockConfig {
  id: string;
  typeId: string;
  title: string;
  day: WorkDay;
  startMinutes: number;
  durationMinutes: number;
  attendeeCount?: number;
  customHp?: number;
  required?: boolean;
  groupId?: string;
  linkedMeetingIds?: string[];
  behaviorConfig?: Record<string, unknown>;
  generation?: number;
  scoreMultiplier?: number;
}
