import type { LevelResult } from '../game/types/game';
import type { GameModeId } from '../game/types/mode';

export type Theme = 'dark' | 'light';
export type Language = 'ru' | 'en';
export type MeetingPalette = 'default' | 'pastel' | 'high-contrast';
export type ControlScheme = 'keyboard' | 'mouse';

export interface UserSettings {
  soundEnabled: boolean;
  volume: number;
  musicEnabled: boolean;
  musicVolume: number;
  theme: Theme;
  meetingPalette: MeetingPalette;
  language: Language;
}
export interface PlayerPreferences {
  playerName: string | null;
  controlScheme: ControlScheme;
  tutorialCompleted: boolean;
  skipTutorialPrompt: boolean;
  skipControlPrompt: boolean;
}
export interface PlayerProgress {
  bestScore: number;
  maxFreedMinutes: number;
  unlockedLevelIds: string[];
  levelBestScores: Record<string, number>;
}
export interface LeaderboardEntry {
  id: string;
  playerName: string;
  mode: GameModeId;
  score: number;
  freedMinutes: number;
  destroyedMeetings: number;
  maxCombo: number;
  wave?: number;
  durationSeconds: number;
  createdAt: string;
}
export interface PlayerProfile {
  version: 2;
  settings: UserSettings;
  preferences: PlayerPreferences;
  progress: PlayerProgress;
  leaderboard: LeaderboardEntry[];
}

export const STORAGE_KEY = 'meeting-breaker-profile';
export const SETTINGS_REGISTRY_KEY = 'meeting-breaker-settings';
export const DEFAULT_SETTINGS: UserSettings = { soundEnabled: true, volume: 0.65, musicEnabled: true, musicVolume: 0.45, theme: 'dark', meetingPalette: 'default', language: 'ru' };
export const DEFAULT_PREFERENCES: PlayerPreferences = { playerName: null, controlScheme: 'keyboard', tutorialCompleted: false, skipTutorialPrompt: false, skipControlPrompt: false };
export const DEFAULT_PROGRESS: PlayerProgress = { bestScore: 0, maxFreedMinutes: 0, unlockedLevelIds: ['calendar-overload'], levelBestScores: {} };
export const DEFAULT_PROFILE: PlayerProfile = { version: 2, settings: DEFAULT_SETTINGS, preferences: DEFAULT_PREFERENCES, progress: DEFAULT_PROGRESS, leaderboard: [] };
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const browserStorage = (): StorageLike | undefined => typeof window === 'undefined' ? undefined : window.localStorage;
const oneOf = <T extends string>(value: unknown, values: readonly T[], fallback: T): T => values.includes(value as T) ? value as T : fallback;
const finite = (value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export function normalizePlayerName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, ' ');
  return name.length >= 2 && name.length <= 24 ? name : null;
}

function sanitizeProfile(value: unknown): PlayerProfile {
  if (!value || typeof value !== 'object') return structuredClone(DEFAULT_PROFILE);
  const source = value as {
    settings?: Partial<UserSettings>;
    preferences?: Partial<PlayerPreferences>;
    progress?: Partial<PlayerProgress>;
    leaderboard?: unknown;
  };
  const settings = source.settings ?? {};
  const preferences = source.preferences ?? {};
  const progress = source.progress ?? {};
  const leaderboard = Array.isArray(source.leaderboard) ? source.leaderboard.filter((entry: unknown) => entry && typeof entry === 'object').slice(0, 150) : [];
  return {
    version: 2,
    settings: {
      soundEnabled: typeof settings.soundEnabled === 'boolean' ? settings.soundEnabled : true,
      volume: finite(settings.volume, DEFAULT_SETTINGS.volume, 0, 1),
      musicEnabled: typeof settings.musicEnabled === 'boolean' ? settings.musicEnabled : true,
      musicVolume: finite(settings.musicVolume, DEFAULT_SETTINGS.musicVolume, 0, 1),
      theme: oneOf(settings.theme, ['dark', 'light'], 'dark'),
      meetingPalette: oneOf(settings.meetingPalette, ['default', 'pastel', 'high-contrast'], 'default'),
      language: oneOf(settings.language, ['ru', 'en'], 'ru'),
    },
    preferences: {
      playerName: typeof preferences.playerName === 'string' ? normalizePlayerName(preferences.playerName) : null,
      controlScheme: oneOf(preferences.controlScheme, ['keyboard', 'mouse'], 'keyboard'),
      tutorialCompleted: Boolean(preferences.tutorialCompleted),
      skipTutorialPrompt: Boolean(preferences.skipTutorialPrompt),
      skipControlPrompt: Boolean(preferences.skipControlPrompt),
    },
    progress: {
      bestScore: finite(progress.bestScore, 0),
      maxFreedMinutes: finite(progress.maxFreedMinutes, 0),
      unlockedLevelIds: Array.isArray(progress.unlockedLevelIds) ? progress.unlockedLevelIds.filter((id: unknown): id is string => typeof id === 'string') : [...DEFAULT_PROGRESS.unlockedLevelIds],
      levelBestScores: progress.levelBestScores && typeof progress.levelBestScores === 'object' ? progress.levelBestScores : {},
    },
    leaderboard: leaderboard as LeaderboardEntry[],
  };
}
export function loadProfile(storage = browserStorage()): PlayerProfile { try { const raw = storage?.getItem(STORAGE_KEY); return raw ? sanitizeProfile(JSON.parse(raw)) : structuredClone(DEFAULT_PROFILE); } catch { return structuredClone(DEFAULT_PROFILE); } }
export function saveProfile(profile: PlayerProfile, storage = browserStorage()): PlayerProfile { const safe = sanitizeProfile(profile); storage?.setItem(STORAGE_KEY, JSON.stringify(safe)); return safe; }
export function updateSettings(profile: PlayerProfile, settings: Partial<UserSettings>, storage = browserStorage()): PlayerProfile { return saveProfile({ ...profile, settings: { ...profile.settings, ...settings } }, storage); }
export function updatePreferences(profile: PlayerProfile, preferences: Partial<PlayerPreferences>, storage = browserStorage()): PlayerProfile { return saveProfile({ ...profile, preferences: { ...profile.preferences, ...preferences } }, storage); }
export function recordLevelResult(profile: PlayerProfile, result: LevelResult, storage = browserStorage(), levelId = 'calendar-overload'): PlayerProfile { const campaignIds = ['calendar-overload', 'month-week-2', 'month-week-3', 'month-week-4', 'month-week-5']; const nextId = campaignIds[campaignIds.indexOf(levelId) + 1]; const unlocked = nextId ? [...new Set([...profile.progress.unlockedLevelIds, nextId])] : profile.progress.unlockedLevelIds; return saveProfile({ ...profile, progress: { ...profile.progress, bestScore: Math.max(profile.progress.bestScore, result.score), maxFreedMinutes: Math.max(profile.progress.maxFreedMinutes, result.freedMinutes), unlockedLevelIds: unlocked, levelBestScores: { ...profile.progress.levelBestScores, [levelId]: Math.max(profile.progress.levelBestScores[levelId] ?? 0, result.score) } } }, storage); }
export function addLeaderboardEntry(profile: PlayerProfile, entry: LeaderboardEntry, storage = browserStorage()): PlayerProfile { const entries = [...profile.leaderboard, entry].sort((a, b) => b.score - a.score).slice(0, 50); return saveProfile({ ...profile, leaderboard: entries }, storage); }
export function clearLeaderboard(profile: PlayerProfile, storage = browserStorage()): PlayerProfile { return saveProfile({ ...profile, leaderboard: [] }, storage); }
export function resetProfile(storage = browserStorage()): PlayerProfile { return saveProfile(structuredClone(DEFAULT_PROFILE), storage); }
