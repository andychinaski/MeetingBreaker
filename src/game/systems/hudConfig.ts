import type { GameModeId } from '../types/mode';

export interface HudConfig { context: 'level' | 'wave'; showCoffee: boolean }

export function getHudConfig(mode: GameModeId): HudConfig {
  return { context: mode === 'campaign' ? 'level' : 'wave', showCoffee: mode !== 'hard' };
}
