import type { LevelResult, ScoreSnapshot } from '../types/game';
import type { TutorialSnapshot } from '../systems/TutorialController';

export const GAME_EVENTS = {
  GAME_STARTED: 'GAME_STARTED',
  SCORE_CHANGED: 'SCORE_CHANGED',
  COFFEE_CHANGED: 'COFFEE_CHANGED',
  COFFEE_CONSUMED: 'COFFEE_CONSUMED',
  MEETING_DESTROYED: 'MEETING_DESTROYED',
  POWER_UP_ACTIVATED: 'POWER_UP_ACTIVATED',
  PAUSE_CHANGED: 'PAUSE_CHANGED',
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  GAME_OVER: 'GAME_OVER',
  MEETING_BEHAVIOR_ACTION: 'MEETING_BEHAVIOR_ACTION',
  THEME_CHANGED: 'THEME_CHANGED',
  WAVE_CHANGED: 'WAVE_CHANGED',
  TUTORIAL_CHANGED: 'TUTORIAL_CHANGED',
} as const;

export const GAME_COMMANDS = {
  RESTART_LEVEL: 'RESTART_LEVEL',
  TOGGLE_PAUSE: 'TOGGLE_PAUSE',
  TUTORIAL_CONTINUE: 'TUTORIAL_CONTINUE',
  TUTORIAL_SKIP: 'TUTORIAL_SKIP',
} as const;

export const GAME_STATE_REGISTRY_KEY = 'meeting-breaker-game-state';
export const TUTORIAL_STATE_REGISTRY_KEY = 'meeting-breaker-tutorial-state';
export type TutorialChangedPayload = TutorialSnapshot;

export interface GameStartedPayload {
  levelId: string;
  levelTitle: string;
  score: ScoreSnapshot;
  coffeeCups: number;
  initialCoffeeCups: number;
  coffeeEnabled?: boolean;
  wave: number;
}

export interface WaveChangedPayload { wave: number }

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
  dropChance: number;
  x: number;
  y: number;
}

export interface PowerUpActivatedPayload {
  powerUpId: string;
  title: string;
  activePowerUps: string[];
}

export interface PauseChangedPayload {
  paused: boolean;
}

export interface LevelCompletedPayload {
  result: LevelResult;
}

export interface GameOverPayload {
  result: LevelResult;
}

export interface MeetingBehaviorActionPayload {
  action: 'spawn-recurring' | 'spawn-children' | 'accelerate-ball' | 'neighbor-destroyed';
  meetingId: string;
  typeId: string;
  config: Record<string, unknown>;
  x: number;
  y: number;
}
