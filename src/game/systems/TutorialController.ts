import type { TranslationKey } from '../../services/i18n';

export type TutorialEvent = 'paddle-moved' | 'ball-launched' | 'meeting-destroyed' | 'ball-lost' | 'espresso-collected' | 'paused' | 'calendar-cleared';
export type TutorialAction = 'move' | 'launch' | 'play' | 'pause';
export type TutorialTarget = 'paddle' | 'ball' | 'meeting' | 'score' | 'coffee' | 'bonus' | 'pause' | 'calendar';
export type TutorialPhase = 'explanation' | 'action' | 'success' | 'completed';

export interface TutorialSpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialStep {
  id: string;
  messageKey: TranslationKey;
  actionMessageKey?: TranslationKey;
  spotlightTarget?: TutorialTarget;
  allowedActions: TutorialAction[];
  completionEvent?: TutorialEvent;
  setup?: 'lose-ball' | 'spawn-espresso';
}

export interface TutorialSnapshot {
  step?: TutorialStep;
  phase: TutorialPhase;
  index: number;
  spotlight?: TutorialSpotlightRect;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  { id: 'paddle', messageKey: 'tutorial.paddle', actionMessageKey: 'tutorial.moveKeyboard', spotlightTarget: 'paddle', allowedActions: ['move'], completionEvent: 'paddle-moved' },
  { id: 'ball', messageKey: 'tutorial.ball', actionMessageKey: 'tutorial.launchKeyboard', spotlightTarget: 'ball', allowedActions: ['launch'], completionEvent: 'ball-launched' },
  { id: 'meeting', messageKey: 'tutorial.meeting', spotlightTarget: 'meeting', allowedActions: ['move', 'play'], completionEvent: 'meeting-destroyed' },
  { id: 'score', messageKey: 'tutorial.score', spotlightTarget: 'score', allowedActions: [] },
  { id: 'coffee', messageKey: 'tutorial.coffee', spotlightTarget: 'coffee', allowedActions: [], completionEvent: 'ball-lost', setup: 'lose-ball' },
  { id: 'bonus', messageKey: 'tutorial.bonus', spotlightTarget: 'bonus', allowedActions: ['move', 'play'], completionEvent: 'espresso-collected', setup: 'spawn-espresso' },
  { id: 'pause', messageKey: 'tutorial.pause', spotlightTarget: 'pause', allowedActions: ['pause'], completionEvent: 'paused' },
  { id: 'independent', messageKey: 'tutorial.independent', spotlightTarget: 'calendar', allowedActions: ['move', 'launch', 'play', 'pause'], completionEvent: 'calendar-cleared' },
];

export class TutorialController {
  private index = 0;
  private phase: TutorialPhase = 'explanation';

  constructor(private readonly steps: readonly TutorialStep[] = TUTORIAL_STEPS) {}

  get current(): TutorialStep | undefined { return this.phase === 'completed' ? undefined : this.steps[this.index]; }
  get snapshot(): TutorialSnapshot { return { step: this.current, phase: this.phase, index: this.index }; }
  get isCompleted(): boolean { return this.phase === 'completed'; }

  continue(): boolean {
    const step = this.current;
    if (!step || this.phase !== 'explanation') return false;
    if (step.completionEvent) this.phase = 'action';
    else this.advance();
    return true;
  }

  allows(action: TutorialAction): boolean {
    return this.phase === 'action' && Boolean(this.current?.allowedActions.includes(action));
  }

  notify(event: TutorialEvent): boolean {
    if (this.phase !== 'action' || this.current?.completionEvent !== event) return false;
    this.phase = 'success';
    return true;
  }

  completeTransition(): boolean {
    if (this.phase !== 'success') return false;
    this.advance();
    return true;
  }

  skip(): void { this.phase = 'completed'; }

  private advance(): void {
    this.index += 1;
    this.phase = this.index >= this.steps.length ? 'completed' : 'explanation';
  }
}
