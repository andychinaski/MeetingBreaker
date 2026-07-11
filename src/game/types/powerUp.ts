export const POWER_UP_TYPES = [
  'async-mode',
  'decline',
  'espresso-shot',
] as const;

export type PowerUpType = (typeof POWER_UP_TYPES)[number];

export interface PowerUpDefinition {
  id: PowerUpType;
  title: string;
  shortLabel: string;
  color: number;
}

export const POWER_UP_DEFINITIONS: Record<PowerUpType, PowerUpDefinition> = {
  'async-mode': {
    id: 'async-mode',
    title: 'Async Mode',
    shortLabel: 'A',
    color: 0x38bdf8,
  },
  decline: {
    id: 'decline',
    title: 'Decline',
    shortLabel: 'D',
    color: 0xf87171,
  },
  'espresso-shot': {
    id: 'espresso-shot',
    title: 'Espresso Shot',
    shortLabel: 'E',
    color: 0xfbbf24,
  },
};
