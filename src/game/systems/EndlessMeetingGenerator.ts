import type { MeetingBlockConfig, WorkDay } from '../types/meeting';
import type { GameModeConfig } from '../types/mode';

export interface CalendarSlot { day: WorkDay; startMinutes: number; durationMinutes: number }
export interface EndlessWave { wave: number; warningSeconds: number; meetings: MeetingBlockConfig[] }

const TYPES = ['daily', 'team-sync', 'project-status', 'sprint-review', 'incident-call', 'recurring-meeting'] as const;

export class EndlessMeetingGenerator {
  private wave = 0;
  constructor(private readonly mode: GameModeConfig, private readonly random = Math.random) {}

  createWave(occupied: readonly CalendarSlot[]): EndlessWave {
    this.wave += 1;
    const difficulty = this.mode.initialDifficulty + (this.wave - 1) * this.mode.difficultyGrowth;
    const count = Math.min(3 + Math.floor(difficulty * 2), 10);
    const free = this.getFreeSlots(occupied);
    const meetings = free.slice(0, count).map((slot, index): MeetingBlockConfig => ({
      id: `wave-${this.wave}-${index}`,
      typeId: TYPES[Math.min(TYPES.length - 1, Math.floor(this.random() * Math.min(TYPES.length, 2 + this.wave)))]!,
      title: `Wave ${this.wave}`,
      ...slot,
      required: true,
    }));
    return { wave: this.wave, warningSeconds: 3, meetings };
  }

  getFreeSlots(occupied: readonly CalendarSlot[]): CalendarSlot[] {
    const days: WorkDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const slots: CalendarSlot[] = [];
    for (const day of days) for (let startMinutes = 540; startMinutes <= 990; startMinutes += 30) {
      if (!occupied.some((item) => item.day === day && Math.abs(item.startMinutes - startMinutes) < 30)) slots.push({ day, startMinutes, durationMinutes: 30 });
    }
    return slots.sort(() => this.random() - 0.5);
  }
}
