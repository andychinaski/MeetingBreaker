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
    behaviorIds: ['timed', 'shielded', 'split'],
    behaviorConfig: { phases: 3, childTypeId: 'project-status' },
  },
  projectStatus: {
    id: 'project-status', title: 'Project Status', shortTitle: 'Status', category: 'status',
    color: '#38bdf8', maxHp: 2, score: 320, freedMinutes: 30, dropChance: 0.12,
  },
  sprintReview: {
    id: 'sprint-review', title: 'Sprint Review', shortTitle: 'Review', category: 'review',
    color: '#818cf8', maxHp: 2, score: 520, freedMinutes: 60, dropChance: 0.16,
  },
  performanceReview: {
    id: 'performance-review', title: 'Performance Review', shortTitle: 'Performance', category: 'review',
    color: '#2dd4bf', maxHp: 3, score: 650, freedMinutes: 45, dropChance: 0.38,
    behaviorIds: ['bonus-drop'], behaviorConfig: { bonusType: 'espresso-shot' },
  },
  corporateTraining: {
    id: 'corporate-training', title: 'Corporate Training', shortTitle: 'Training', category: 'training',
    color: '#a78bfa', maxHp: 3, score: 900, freedMinutes: 120, dropChance: 0.2,
    behaviorIds: ['slow-field'], behaviorConfig: { fieldModifier: 0.72 },
  },
  stakeholderMeeting: {
    id: 'stakeholder-meeting', title: 'Stakeholder Meeting', shortTitle: 'Stakeholders', category: 'stakeholder',
    color: '#f59e0b', maxHp: 4, score: 1200, freedMinutes: 90, dropChance: 0.24,
    behaviorIds: ['shielded'],
  },
  preparationMeeting: {
    id: 'preparation-meeting', title: 'Preparation Meeting', shortTitle: 'Preparation', category: 'preparation',
    color: '#22d3ee', maxHp: 1, score: 180, freedMinutes: 15, dropChance: 0.08,
  },
  incidentCall: {
    id: 'incident-call', title: 'Incident Call', shortTitle: 'Incident!', category: 'incident',
    color: '#ef4444', maxHp: 2, score: 1000, freedMinutes: 60, dropChance: 0.35,
    behaviorIds: ['moving', 'blinking', 'accelerating', 'bonus-drop'],
    behaviorConfig: { moveSpeed: 34, moveRange: 32, acceleration: 1.12 },
  },
  recurringMeeting: {
    id: 'recurring-meeting', title: 'Recurring Meeting', shortTitle: '↻ Recurring', category: 'recurring',
    color: '#fb7185', maxHp: 1, score: 450, freedMinutes: 30, dropChance: 0.12,
    behaviorIds: ['recurring'], behaviorConfig: { maxGenerations: 2, rewardMultiplier: 0.5 },
  },
  retrospective: {
    id: 'retrospective', title: 'Retrospective', shortTitle: 'Retro', category: 'retrospective',
    color: '#c084fc', maxHp: 2, score: 700, freedMinutes: 60, dropChance: 0.16,
    behaviorIds: ['split'], behaviorConfig: { childTypeId: 'action-item', minChildren: 2, maxChildren: 3 },
  },
  actionItem: {
    id: 'action-item', title: 'Action Item', shortTitle: 'Action', category: 'action-item',
    color: '#f0abfc', maxHp: 1, score: 140, freedMinutes: 10, dropChance: 0.04,
  },
  crossTeamSync: {
    id: 'cross-team-sync', title: 'Cross-Team Sync', shortTitle: 'Cross-Team', category: 'sync',
    color: '#34d399', maxHp: 2, score: 600, freedMinutes: 45, dropChance: 0.14,
    behaviorIds: ['linked'], behaviorConfig: { damageMultiplier: 0.5 },
  },
  goNoGo: {
    id: 'go-no-go', title: 'Go / No-Go', shortTitle: 'Go/No-Go', category: 'decision',
    color: '#facc15', maxHp: 3, score: 1100, freedMinutes: 60, dropChance: 0.22,
    behaviorIds: ['timed', 'blinking'], behaviorConfig: { phaseInterval: 1800 },
  },
  postmortem: {
    id: 'postmortem', title: 'Postmortem', shortTitle: 'Postmortem', category: 'postmortem',
    color: '#f97316', maxHp: 4, score: 1400, freedMinutes: 90, dropChance: 0.28,
    behaviorIds: ['split', 'timed'], behaviorConfig: { childTypeId: 'incident-call', maxChildren: 2 },
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
