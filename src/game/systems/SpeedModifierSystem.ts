export type SpeedModifierId = 'mode' | 'espresso' | 'meeting-field' | 'acceleration';

export class SpeedModifierSystem {
  private readonly modifiers = new Map<SpeedModifierId, number>();

  constructor(
    readonly baseSpeed: number,
    readonly maximumSpeed: number,
  ) {}

  set(id: SpeedModifierId, multiplier: number): void {
    this.modifiers.set(id, Math.max(0.1, multiplier));
  }

  remove(id: SpeedModifierId): void {
    this.modifiers.delete(id);
  }

  get finalSpeed(): number {
    const multiplier = [...this.modifiers.values()].reduce(
      (result, value) => result * value,
      1,
    );
    return Math.min(this.baseSpeed * multiplier, this.maximumSpeed);
  }
}
