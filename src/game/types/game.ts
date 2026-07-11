export type GameStatus =
  | 'idle'
  | 'playing'
  | 'paused'
  | 'won'
  | 'lost';

export interface ScoreSnapshot {
  score: number;
  freedMinutes: number;
  destroyedMeetings: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
}

export interface GameState extends ScoreSnapshot {
  coffeeCups: number;
  initialCoffeeCups: number;
  activePowerUps: string[];
  coffeeEnabled: boolean;
  status: GameStatus;
}

export interface LevelResult extends ScoreSnapshot {
  coffeeSpent: number;
  rating: string;
}
