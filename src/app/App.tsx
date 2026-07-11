import { useEffect, useState } from 'react';
import { GameCanvas } from '../components/GameCanvas';
import { MainMenu } from '../components/MainMenu';
import { SettingsModal } from '../components/SettingsModal';
import { LEVELS } from '../data/levels';
import type { LevelResult } from '../game/types/game';
import {
  loadProfile,
  recordLevelResult,
  updateSettings,
  type UserSettings,
} from '../services/storageService';
import styles from './App.module.css';

export function App() {
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [profile, setProfile] = useState(loadProfile);
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0]?.id ?? '');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = profile.settings.theme;
  }, [profile.settings.theme]);

  const saveSettings = (settings: UserSettings) => {
    setProfile((current) => updateSettings(current, settings));
    setSettingsOpen(false);
  };

  const saveResult = (result: LevelResult) => {
    setProfile((current) => recordLevelResult(current, result));
  };

  return (
    <main
      className={`${styles.appShell} ${
        screen === 'game' ? styles.gameShell : styles.menuShell
      }`}
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>Дай календарю пизды</p>
        <h1>Meeting Breaker</h1>
        <p className={styles.subtitle}>
          Освобождайте фокус-время — по одной встрече за раз.
        </p>
      </header>

      {screen === 'menu' ? (
        <MainMenu
          levels={LEVELS}
          selectedLevelId={selectedLevelId}
          progress={profile.progress}
          onSelectLevel={setSelectedLevelId}
          onStart={() => setScreen('game')}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <GameCanvas
          settings={profile.settings}
          onExitToMenu={() => setScreen('menu')}
          onLevelResult={saveResult}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={profile.settings}
          onSave={saveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}
