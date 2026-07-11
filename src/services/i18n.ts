import type { Language } from './storageService';
const translations = {
  ru: { 'menu.play': 'Играть', 'menu.leaderboard': 'Таблица лидеров', 'menu.settings': 'Настройки', 'menu.info': 'Информация', 'app.subtitle': 'Освобождайте фокус-время — по одной встрече за раз.' },
  en: { 'menu.play': 'Play', 'menu.leaderboard': 'Leaderboard', 'menu.settings': 'Settings', 'menu.info': 'Information', 'app.subtitle': 'Free up focus time — one meeting at a time.' },
} as const;
export type TranslationKey = keyof typeof translations.ru;
export function t(language: Language, key: TranslationKey): string { return translations[language][key] ?? translations.ru[key]; }
