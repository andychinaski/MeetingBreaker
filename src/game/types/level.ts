import type { MeetingBlockConfig } from './meeting';

export interface LevelConfig {
  id: string;
  title: string;
  description: string;
  initialBallSpeed: number;
  initialCoffeeCups: number;
  meetings: MeetingBlockConfig[];
  scoreTarget?: number;
  timeLimitSeconds?: number;
}
