export type TutorialEvent = 'paddle-moved' | 'ball-launched' | 'meeting-destroyed' | 'durable-meeting-destroyed' | 'score-changed' | 'combo-changed' | 'ball-lost' | 'espresso-collected' | 'decline-collected' | 'async-collected' | 'paused' | 'level-completed';
export interface TutorialStep { id: string; message: string; waitForEvent: TutorialEvent; highlightTarget?: string; allowSkip?: boolean }
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  { id: 'move', message: 'Перемести платформу мышью или клавишами A / D.', waitForEvent: 'paddle-moved', highlightTarget: 'paddle', allowSkip: true },
  { id: 'launch', message: 'Запусти шарик пробелом или кликом.', waitForEvent: 'ball-launched', highlightTarget: 'ball' },
  { id: 'meeting', message: 'Разбей обычную встречу.', waitForEvent: 'meeting-destroyed' },
  { id: 'durable', message: 'Встречам с несколькими HP нужно несколько ударов.', waitForEvent: 'durable-meeting-destroyed' },
  { id: 'coffee', message: 'Потерянный шарик расходует чашку кофе.', waitForEvent: 'ball-lost', highlightTarget: 'coffee' },
  { id: 'espresso', message: 'Espresso Shot расширяет платформу и замедляет шарик.', waitForEvent: 'espresso-collected' },
  { id: 'pause', message: 'Escape ставит рабочую неделю на паузу.', waitForEvent: 'paused' },
  { id: 'complete', message: 'Заверши учебную рабочую неделю.', waitForEvent: 'level-completed' },
];
export class TutorialController {
  private index = 0;
  private completed = false;
  constructor(private readonly steps: readonly TutorialStep[] = TUTORIAL_STEPS) {}
  get current(): TutorialStep | undefined { return this.completed ? undefined : this.steps[this.index]; }
  notify(event: TutorialEvent): boolean { if (!this.current || this.current.waitForEvent !== event) return false; this.index += 1; this.completed = this.index >= this.steps.length; return true; }
  skip(): void { this.completed = true; }
  get isCompleted(): boolean { return this.completed; }
}
