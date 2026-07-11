import type Phaser from 'phaser';
import type { MeetingBlock } from '../objects/MeetingBlock';
import type { MeetingBehaviorId, MeetingBlockConfig, MeetingType } from '../types/meeting';

export interface MeetingBehaviorContext {
  scene: Phaser.Scene;
  block: MeetingBlock;
  config: MeetingBlockConfig;
  meetingType: MeetingType;
  isDestroyed: () => boolean;
  setShielded: (shielded: boolean) => void;
  setBlinking: (active: boolean) => void;
  moveBy: (x: number, y: number) => void;
  emitAction: (action: 'spawn-recurring' | 'spawn-children' | 'accelerate-ball') => void;
}

export interface MeetingBehavior {
  onCreate?(context: MeetingBehaviorContext): void;
  onHit?(context: MeetingBehaviorContext): void;
  onDestroy?(context: MeetingBehaviorContext): void;
  onUpdate?(context: MeetingBehaviorContext, delta: number): void;
  onBallCollision?(context: MeetingBehaviorContext): void;
  onNeighborDestroyed?(context: MeetingBehaviorContext): void;
  dispose?(): void;
}

class MovingBehavior implements MeetingBehavior {
  private direction = 1;
  onUpdate(context: MeetingBehaviorContext, delta: number): void {
    const speed = Number(context.meetingType.behaviorConfig?.moveSpeed ?? 24);
    const range = Number(context.meetingType.behaviorConfig?.moveRange ?? 24);
    const originX = Number(context.config.behaviorConfig?.originX ?? context.block.x);
    context.config.behaviorConfig = { ...context.config.behaviorConfig, originX };
    if (Math.abs(context.block.x - originX) >= range) this.direction *= -1;
    context.moveBy(this.direction * speed * delta / 1000, 0);
  }
}

class BlinkingBehavior implements MeetingBehavior {
  private elapsed = 0;
  onUpdate(context: MeetingBehaviorContext, delta: number): void {
    this.elapsed += delta;
    const interval = Number(context.meetingType.behaviorConfig?.blinkInterval ?? 650);
    context.setBlinking(Math.floor(this.elapsed / interval) % 2 === 1);
  }
  dispose(): void { this.elapsed = 0; }
}

class ShieldedBehavior implements MeetingBehavior {
  onCreate(context: MeetingBehaviorContext): void { context.setShielded(true); }
}

class RecurringBehavior implements MeetingBehavior {
  onDestroy(context: MeetingBehaviorContext): void {
    const generation = context.config.generation ?? 0;
    const limit = Number(context.meetingType.behaviorConfig?.maxGenerations ?? 2);
    if (generation < limit) context.emitAction('spawn-recurring');
  }
}

class SplitBehavior implements MeetingBehavior {
  onDestroy(context: MeetingBehaviorContext): void { context.emitAction('spawn-children'); }
}

class AcceleratingBehavior implements MeetingBehavior {
  onHit(context: MeetingBehaviorContext): void { context.emitAction('accelerate-ball'); }
}

class TimedBehavior implements MeetingBehavior {
  private elapsed = 0;
  private shielded = false;
  onUpdate(context: MeetingBehaviorContext, delta: number): void {
    this.elapsed += delta;
    const interval = Number(context.meetingType.behaviorConfig?.phaseInterval ?? 1800);
    if (this.elapsed >= interval) {
      this.elapsed = 0;
      this.shielded = !this.shielded;
      context.setShielded(this.shielded);
      context.setBlinking(true);
    } else if (this.elapsed > 220) context.setBlinking(false);
  }
}

class NoopBehavior implements MeetingBehavior {}

export function createMeetingBehaviors(ids: readonly MeetingBehaviorId[] = []): MeetingBehavior[] {
  return ids.map((id) => {
    if (id === 'moving') return new MovingBehavior();
    if (id === 'blinking') return new BlinkingBehavior();
    if (id === 'shielded') return new ShieldedBehavior();
    if (id === 'recurring') return new RecurringBehavior();
    if (id === 'split') return new SplitBehavior();
    if (id === 'accelerating') return new AcceleratingBehavior();
    if (id === 'timed') return new TimedBehavior();
    return new NoopBehavior();
  });
}
