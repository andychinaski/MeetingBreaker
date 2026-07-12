import { describe, expect, it } from 'vitest';
import { TutorialController, type TutorialStep } from './TutorialController';

const steps: TutorialStep[] = [
  { id: 'move', messageKey: 'tutorial.paddle', allowedActions: ['move'], completionEvent: 'paddle-moved' },
  { id: 'info', messageKey: 'tutorial.score', allowedActions: [] },
];

describe('TutorialController', () => {
  it('separates explanation and action and advances once for the expected event', () => {
    const tutorial = new TutorialController(steps);
    expect(tutorial.allows('move')).toBe(false);
    expect(tutorial.continue()).toBe(true);
    expect(tutorial.allows('move')).toBe(true);
    expect(tutorial.notify('ball-launched')).toBe(false);
    expect(tutorial.notify('paddle-moved')).toBe(true);
    expect(tutorial.notify('paddle-moved')).toBe(false);
    expect(tutorial.current?.id).toBe('info');
  });
  it('can be skipped', () => { const tutorial = new TutorialController(); tutorial.skip(); expect(tutorial.isCompleted).toBe(true); });
});
