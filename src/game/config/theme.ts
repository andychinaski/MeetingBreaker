import type { Theme } from '../../services/storageService';

export const GAME_THEME_REGISTRY_KEY = 'meeting-breaker-theme';

export interface GameTheme {
  canvas: number;
  canvasCss: string;
  columnOdd: number;
  columnEven: number;
  border: number;
  majorGrid: number;
  minorGrid: number;
  label: string;
  mutedLabel: string;
  bounds: number;
  tutorialBackground: string;
  tutorialText: string;
}

export const GAME_THEMES: Record<Theme, GameTheme> = {
  dark: { canvas: 0x101827, canvasCss: '#101827', columnOdd: 0x111c2e, columnEven: 0x142033, border: 0x334155, majorGrid: 0x64748b, minorGrid: 0x475569, label: '#cbd5e1', mutedLabel: '#64748b', bounds: 0x334155, tutorialBackground: '#0f172add', tutorialText: '#f8fafc' },
  light: { canvas: 0xf5f9fd, canvasCss: '#f5f9fd', columnOdd: 0xffffff, columnEven: 0xeaf3fb, border: 0x8eb6d8, majorGrid: 0x4e83ad, minorGrid: 0x9bbddd, label: '#163b5c', mutedLabel: '#496b87', bounds: 0x377fb5, tutorialBackground: '#ffffffff', tutorialText: '#102a43' },
};

export function getGameTheme(theme: Theme): GameTheme { return GAME_THEMES[theme]; }
