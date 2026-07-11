export type GameModeId = 'campaign' | 'relax' | 'hard';
export const MODE_REGISTRY_KEY = 'meeting-breaker-mode';
export const TUTORIAL_REGISTRY_KEY = 'meeting-breaker-tutorial';
export const LEVEL_REGISTRY_KEY = 'meeting-breaker-level';

export interface GameModeConfig {
  id: GameModeId;
  endless: boolean;
  coffeeEnabled: boolean;
  initialCoffeeCups?: number;
  ballAccelerationEnabled: boolean;
  bonusDropMultiplier: number;
  scoreMultiplier: number;
  initialDifficulty: number;
  difficultyGrowth: number;
}

export const GAME_MODES: Record<GameModeId, GameModeConfig> = {
  campaign: { id: 'campaign', endless: false, coffeeEnabled: true, initialCoffeeCups: 3, ballAccelerationEnabled: true, bonusDropMultiplier: 1, scoreMultiplier: 1, initialDifficulty: 1, difficultyGrowth: 0.12 },
  relax: { id: 'relax', endless: true, coffeeEnabled: true, initialCoffeeCups: 3, ballAccelerationEnabled: false, bonusDropMultiplier: 1.25, scoreMultiplier: 1, initialDifficulty: 0.8, difficultyGrowth: 0.08 },
  hard: { id: 'hard', endless: true, coffeeEnabled: false, ballAccelerationEnabled: true, bonusDropMultiplier: 0.55, scoreMultiplier: 1.75, initialDifficulty: 1.35, difficultyGrowth: 0.18 },
};
