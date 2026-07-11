import type { PowerUpType } from '../types/powerUp';

export const ESPRESSO_DURATION_MS = 10_000;

export interface PowerUpActivationResult {
  type: PowerUpType;
  asyncBallRequested: boolean;
  espressoRefreshed: boolean;
}

export class PowerUpSystem {
  private declineAvailable = false;
  private espressoExpiresAt = 0;

  activate(type: PowerUpType, now: number): PowerUpActivationResult {
    const espressoWasActive = this.isEspressoActive(now);

    if (type === 'decline') {
      this.declineAvailable = true;
    } else if (type === 'espresso-shot') {
      this.espressoExpiresAt = now + ESPRESSO_DURATION_MS;
    }

    return {
      type,
      asyncBallRequested: type === 'async-mode',
      espressoRefreshed: type === 'espresso-shot' && espressoWasActive,
    };
  }

  consumeDecline(): boolean {
    if (!this.declineAvailable) {
      return false;
    }

    this.declineAvailable = false;
    return true;
  }

  isEspressoActive(now: number): boolean {
    return this.espressoExpiresAt > now;
  }

  expireEspresso(now: number): boolean {
    if (this.espressoExpiresAt === 0 || now < this.espressoExpiresAt) {
      return false;
    }

    this.espressoExpiresAt = 0;
    return true;
  }

  getActiveTypes(now: number): PowerUpType[] {
    const active: PowerUpType[] = [];

    if (this.declineAvailable) {
      active.push('decline');
    }

    if (this.isEspressoActive(now)) {
      active.push('espresso-shot');
    }

    return active;
  }

  reset(): void {
    this.declineAvailable = false;
    this.espressoExpiresAt = 0;
  }
}
