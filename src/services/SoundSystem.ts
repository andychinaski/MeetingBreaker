import type { UserSettings } from './storageService';

export type SoundCue =
  | 'paddle'
  | 'meeting'
  | 'destroy'
  | 'bonus'
  | 'lost'
  | 'coffee'
  | 'victory'
  | 'defeat';

const SOUND_CONFIG: Record<
  SoundCue,
  { frequency: number; duration: number; wave: OscillatorType }
> = {
  paddle: { frequency: 220, duration: 0.055, wave: 'square' },
  meeting: { frequency: 330, duration: 0.06, wave: 'triangle' },
  destroy: { frequency: 520, duration: 0.13, wave: 'sawtooth' },
  bonus: { frequency: 740, duration: 0.16, wave: 'sine' },
  lost: { frequency: 145, duration: 0.2, wave: 'sawtooth' },
  coffee: { frequency: 265, duration: 0.12, wave: 'sine' },
  victory: { frequency: 880, duration: 0.28, wave: 'triangle' },
  defeat: { frequency: 105, duration: 0.34, wave: 'sawtooth' },
};

export class SoundSystem {
  private context?: AudioContext;

  constructor(private readonly getSettings: () => UserSettings) {}

  play(cue: SoundCue): void {
    const settings = this.getSettings();
    if (!settings.soundEnabled || settings.volume <= 0) {
      return;
    }

    try {
      this.context ??= new AudioContext();
      const context = this.context;
      const config = SOUND_CONFIG[cue];
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;

      oscillator.type = config.wave;
      oscillator.frequency.setValueAtTime(config.frequency, now);
      gain.gain.setValueAtTime(Math.max(settings.volume * 0.08, 0.001), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + config.duration);
    } catch {
      // Browsers may block audio until the first user gesture; gameplay continues.
    }
  }

  destroy(): void {
    void this.context?.close().catch(() => undefined);
    this.context = undefined;
  }
}
