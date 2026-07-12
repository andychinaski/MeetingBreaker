import type { LevelConfig } from '../game/types/level';
import type { MeetingBlockConfig, WorkDay } from '../game/types/meeting';

const days: WorkDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function meeting(index: number, typeId: string, customHp?: number): MeetingBlockConfig {
  const day = days[index % days.length]!;
  const row = Math.floor(index / days.length);
  return {
    id: `meeting-${index + 1}`,
    typeId,
    title: typeId,
    day,
    startMinutes: 555 + row * 105,
    durationMinutes: row % 2 === 0 ? 30 : 60,
    attendeeCount: 3 + index,
    customHp,
    required: true,
  };
}

const levelOneMeetings = Array.from({ length: 10 }, (_, index) =>
  meeting(index, index % 3 === 0 ? 'team-sync' : 'daily', 1),
);
const levelTwoTypes = ['daily', 'team-sync', 'one-to-one', 'refinement'] as const;
const levelTwoMeetings = Array.from({ length: 14 }, (_, index) =>
  meeting(index, levelTwoTypes[index % levelTwoTypes.length]!, index % 4 === 3 ? 2 : 1),
);
const advancedTypes = ['daily', 'team-sync', 'one-to-one', 'refinement', 'sprint-planning', 'architecture-review', 'meeting-without-agenda', 'all-hands'] as const;
const advancedMeetings = Array.from({ length: 18 }, (_, index) =>
  meeting(index, advancedTypes[index % advancedTypes.length]!),
);

export const LEVELS: readonly LevelConfig[] = [
  { id: 'calendar-overload', title: 'Неделя 1 · Первый созвон', description: 'Простая рабочая неделя: только статические встречи с 1 HP.', initialBallSpeed: 360, initialCoffeeCups: 3, meetings: levelOneMeetings },
  { id: 'month-week-2', title: 'Неделя 2 · Плотный график', description: 'Статические встречи с 1–2 HP и стандартными бонусами.', initialBallSpeed: 390, initialCoffeeCups: 3, meetings: levelTwoMeetings.map((item) => ({ ...item, id: `w2-${item.id}` })) },
  ...[3, 4, 5].map((week): LevelConfig => ({ id: `month-week-${week}`, title: week === 5 ? 'Финальная неделя · All Hands' : `Неделя ${week} · Calendar Overload`, description: 'Более плотная раскладка и разные MVP-типы встреч.', initialBallSpeed: 410 + (week - 3) * 25, initialCoffeeCups: 3, meetings: advancedMeetings.map((item) => ({ ...item, id: `w${week}-${item.id}` })) })),
];

export const TUTORIAL_LEVEL: LevelConfig = {
  id: 'tutorial-week',
  title: 'Учебная рабочая неделя',
  description: 'Пошаговое знакомство с управлением и базовыми механиками.',
  initialBallSpeed: 330,
  initialCoffeeCups: 3,
  meetings: [
    { ...meeting(0, 'daily', 1), id: 'tutorial-basic', title: 'Обычная встреча' },
    { ...meeting(2, 'team-sync', 1), id: 'tutorial-sync-1', title: 'Командная встреча' },
    { ...meeting(4, 'daily', 1), id: 'tutorial-daily-2', title: 'Ежедневная встреча' },
    { ...meeting(6, 'team-sync', 1), id: 'tutorial-sync-2', title: 'Командная встреча' },
    { ...meeting(8, 'daily', 1), id: 'tutorial-daily-3', title: 'Ежедневная встреча' },
  ],
};

export const DEFAULT_LEVEL = LEVELS[0]!;
