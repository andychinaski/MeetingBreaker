import type { MeetingDestroyedPayload } from '../events/gameEvents';
import type { LevelResult, ScoreSnapshot } from '../types/game';
import type { Language } from '../../services/storageService';

export function calculateComboMultiplier(combo: number): number {
  if (combo <= 0) {
    return 1;
  }

  return Math.min(1 + Math.floor((combo - 1) / 3) * 0.25, 2);
}

export function formatFreedTime(minutes: number, language: Language = 'ru'): string {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} ${language === 'ru' ? 'мин' : 'min'}`;
  }

  if (remainingMinutes === 0) {
    return `${hours} ${language === 'ru' ? 'ч' : 'h'}`;
  }

  return `${hours} ${language === 'ru' ? 'ч' : 'h'} ${remainingMinutes} ${language === 'ru' ? 'мин' : 'min'}`;
}

export function calculateRating(score: number): string {
  if (score >= 7_500) {
    return 'Meeting Destroyer';
  }

  if (score >= 4_500) {
    return 'Рабочая неделя спасена';
  }

  if (score >= 2_500) {
    return 'Focus Keeper';
  }

  return 'Calendar Survivor';
}

export class ScoreSystem {
  private score = 0;
  private freedMinutes = 0;
  private destroyedMeetings = 0;
  private combo = 0;
  private maxCombo = 0;
  constructor(private readonly modeMultiplier = 1) {}

  registerMeetingDestroyed(
    meeting: Pick<MeetingDestroyedPayload, 'score' | 'freedMinutes'>,
  ): ScoreSnapshot {
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.destroyedMeetings += 1;
    this.freedMinutes += meeting.freedMinutes;
    this.score += Math.round(
      meeting.score * calculateComboMultiplier(this.combo) * this.modeMultiplier,
    );

    return this.snapshot;
  }

  resetCombo(): ScoreSnapshot {
    this.combo = 0;
    return this.snapshot;
  }

  get snapshot(): ScoreSnapshot {
    return {
      score: this.score,
      freedMinutes: this.freedMinutes,
      destroyedMeetings: this.destroyedMeetings,
      combo: this.combo,
      maxCombo: this.maxCombo,
      multiplier: calculateComboMultiplier(this.combo) * this.modeMultiplier,
    };
  }

  createLevelResult(coffeeSpent: number): LevelResult {
    return {
      ...this.snapshot,
      coffeeSpent,
      rating: calculateRating(this.score),
    };
  }
}
