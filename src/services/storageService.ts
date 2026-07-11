import type { LevelResult } from '../game/types/game';

export type Theme = 'dark' | 'light';

export interface UserSettings {
  soundEnabled: boolean;
  volume: number;
  theme: Theme;
}

export interface PlayerProgress {
  bestScore: number;
  maxFreedMinutes: number;
  unlockedLevelIds: string[];
}

export interface PlayerProfile {
  version: 1;
  settings: UserSettings;
  progress: PlayerProgress;
}

export const STORAGE_KEY = 'meeting-breaker-profile';
export const SETTINGS_REGISTRY_KEY = 'meeting-breaker-settings';

export const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  volume: 0.65,
  theme: 'dark',
};

export const DEFAULT_PROGRESS: PlayerProgress = {
  bestScore: 0,
  maxFreedMinutes: 0,
  unlockedLevelIds: ['calendar-overload'],
};

export const DEFAULT_PROFILE: PlayerProfile = {
  version: 1,
  settings: DEFAULT_SETTINGS,
  progress: DEFAULT_PROGRESS,
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function getBrowserStorage(): StorageLike | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

function sanitizeProfile(value: unknown): PlayerProfile {
  if (!value || typeof value !== 'object') {
    return structuredClone(DEFAULT_PROFILE);
  }

  const candidate = value as Partial<PlayerProfile>;
  const settings = candidate.settings;
  const progress = candidate.progress;

  return {
    version: 1,
    settings: {
      soundEnabled:
        typeof settings?.soundEnabled === 'boolean'
          ? settings.soundEnabled
          : DEFAULT_SETTINGS.soundEnabled,
      volume:
        typeof settings?.volume === 'number' && Number.isFinite(settings.volume)
          ? Math.min(Math.max(settings.volume, 0), 1)
          : DEFAULT_SETTINGS.volume,
      theme: isTheme(settings?.theme) ? settings.theme : DEFAULT_SETTINGS.theme,
    },
    progress: {
      bestScore:
        typeof progress?.bestScore === 'number' && progress.bestScore >= 0
          ? progress.bestScore
          : 0,
      maxFreedMinutes:
        typeof progress?.maxFreedMinutes === 'number' &&
        progress.maxFreedMinutes >= 0
          ? progress.maxFreedMinutes
          : 0,
      unlockedLevelIds:
        Array.isArray(progress?.unlockedLevelIds) &&
        progress.unlockedLevelIds.every((id) => typeof id === 'string')
          ? [...progress.unlockedLevelIds]
          : [...DEFAULT_PROGRESS.unlockedLevelIds],
    },
  };
}

export function loadProfile(storage = getBrowserStorage()): PlayerProfile {
  if (!storage) {
    return structuredClone(DEFAULT_PROFILE);
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? sanitizeProfile(JSON.parse(raw) as unknown) : structuredClone(DEFAULT_PROFILE);
  } catch {
    return structuredClone(DEFAULT_PROFILE);
  }
}

export function saveProfile(
  profile: PlayerProfile,
  storage = getBrowserStorage(),
): PlayerProfile {
  const safeProfile = sanitizeProfile(profile);
  storage?.setItem(STORAGE_KEY, JSON.stringify(safeProfile));
  return safeProfile;
}

export function updateSettings(
  profile: PlayerProfile,
  settings: UserSettings,
  storage = getBrowserStorage(),
): PlayerProfile {
  return saveProfile({ ...profile, settings }, storage);
}

export function recordLevelResult(
  profile: PlayerProfile,
  result: LevelResult,
  storage = getBrowserStorage(),
): PlayerProfile {
  return saveProfile(
    {
      ...profile,
      progress: {
        ...profile.progress,
        bestScore: Math.max(profile.progress.bestScore, result.score),
        maxFreedMinutes: Math.max(
          profile.progress.maxFreedMinutes,
          result.freedMinutes,
        ),
      },
    },
    storage,
  );
}
