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
  | 'all-hands';

export type MeetingEffect = 'moving' | 'replicating';

export interface MeetingType {
  id: string;
  title: string;
  shortTitle: string;
  category: MeetingCategory;
  color: string;
  maxHp: number;
  score: number;
  freedMinutes: number;
  dropChance: number;
  specialEffect?: MeetingEffect;
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
}
