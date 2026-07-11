import type { MeetingType } from '../game/types/meeting';

export const MEETING_TYPES = {
  daily: {
    id: 'daily',
    title: 'Daily Stand-up',
    shortTitle: 'Daily',
    category: 'daily',
    color: '#60a5fa',
    maxHp: 1,
    score: 100,
    freedMinutes: 15,
    dropChance: 0.08,
  },
  teamSync: {
    id: 'team-sync',
    title: 'Team Sync',
    shortTitle: 'Sync',
    category: 'sync',
    color: '#4ade80',
    maxHp: 1,
    score: 200,
    freedMinutes: 30,
    dropChance: 0.1,
  },
  refinement: {
    id: 'refinement',
    title: 'Backlog Refinement',
    shortTitle: 'Refinement',
    category: 'refinement',
    color: '#fb923c',
    maxHp: 2,
    score: 400,
    freedMinutes: 60,
    dropChance: 0.14,
  },
  sprintPlanning: {
    id: 'sprint-planning',
    title: 'Sprint Planning',
    shortTitle: 'Planning',
    category: 'planning',
    color: '#c084fc',
    maxHp: 3,
    score: 800,
    freedMinutes: 120,
    dropChance: 0.18,
  },
  architectureReview: {
    id: 'architecture-review',
    title: 'Architecture Review',
    shortTitle: 'Architecture',
    category: 'technical',
    color: '#3b82f6',
    maxHp: 3,
    score: 500,
    freedMinutes: 60,
    dropChance: 0.15,
  },
  oneToOne: {
    id: 'one-to-one',
    title: 'One-to-One',
    shortTitle: '1:1',
    category: 'one-to-one',
    color: '#2dd4bf',
    maxHp: 2,
    score: 250,
    freedMinutes: 30,
    dropChance: 0.12,
  },
  meetingWithoutAgenda: {
    id: 'meeting-without-agenda',
    title: 'Meeting Without Agenda',
    shortTitle: 'No Agenda',
    category: 'useless',
    color: '#f87171',
    maxHp: 1,
    score: 600,
    freedMinutes: 60,
    dropChance: 0.24,
  },
  allHands: {
    id: 'all-hands',
    title: 'All Hands',
    shortTitle: 'All Hands',
    category: 'all-hands',
    color: '#f59e0b',
    maxHp: 5,
    score: 1500,
    freedMinutes: 120,
    dropChance: 0.3,
  },
} as const satisfies Record<string, MeetingType>;

export const MEETING_TYPE_LIST: readonly MeetingType[] =
  Object.values(MEETING_TYPES);

export function getMeetingType(typeId: string): MeetingType {
  const meetingType = MEETING_TYPE_LIST.find((type) => type.id === typeId);

  if (!meetingType) {
    throw new Error(`Unknown meeting type: ${typeId}`);
  }

  return meetingType;
}
