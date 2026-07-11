export interface DamageResult {
  previousHp: number;
  currentHp: number;
  destroyedNow: boolean;
}

export class MeetingDurability {
  private hp: number;

  constructor(readonly maxHp: number) {
    if (!Number.isInteger(maxHp) || maxHp <= 0) {
      throw new Error('Meeting max HP must be a positive integer');
    }

    this.hp = maxHp;
  }

  get currentHp(): number {
    return this.hp;
  }

  get destroyed(): boolean {
    return this.hp === 0;
  }

  damage(amount = 1): DamageResult {
    const previousHp = this.hp;

    if (this.destroyed || amount <= 0) {
      return { previousHp, currentHp: this.hp, destroyedNow: false };
    }

    this.hp = Math.max(0, this.hp - amount);

    return {
      previousHp,
      currentHp: this.hp,
      destroyedNow: previousHp > 0 && this.hp === 0,
    };
  }
}
