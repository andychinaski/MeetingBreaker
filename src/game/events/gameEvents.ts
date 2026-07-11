import type { LevelResult, ScoreSnapshot } from '../types/game';

export const GAME_EVENTS = {
  GAME_STARTED: 'GAME_STARTED',
  SCORE_CHANGED: 'SCORE_CHANGED',
  COFFEE_CHANGED: 'COFFEE_CHANGED',
  COFFEE_CONSUMED: 'COFFEE_CONSUMED',
  MEETING_DESTROYED: 'MEETING_DESTROYED',
  POWER_UP_ACTIVATED: 'POWER_UP_ACTIVATED',
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  GAME_OVER: 'GAME_OVER',
} as const;

export const GAME_COMMANDS = {
  RESTART_LEVEL: 'RESTART_LEVEL',
} as const;

export const GAME_STATE_REGISTRY_KEY = 'meeting-breaker-game-state';

export interface GameStartedPayload {
  levelId: string;
  levelTitle: string;
  score: ScoreSnapshot;
  coffeeCups: number;
  initialCoffeeCups: number;
}

export type ScoreChangedPayload = ScoreSnapshot;

export interface CoffeeChangedPayload {
  coffeeCups: number;
  initialCoffeeCups: number;
}

export interface CoffeeConsumedPayload extends CoffeeChangedPayload {
  message: string;
}

export interface MeetingDestroyedPayload {
  meetingId: string;
  typeId: string;
  score: number;
  freedMinutes: number;
  required: boolean;
}

export interface PowerUpActivatedPayload {
  powerUpId: string;
  title: string;
}

export interface LevelCompletedPayload {
  result: LevelResult;
}

export interface GameOverPayload {
  result: LevelResult;
}
