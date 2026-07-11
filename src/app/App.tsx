import { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../components/GameCanvas';
import { InfoScreen } from '../components/InfoScreen';
import { Leaderboard } from '../components/Leaderboard';
import { MainMenu } from '../components/MainMenu';
import { ModeSelect } from '../components/ModeSelect';
import { OnboardingModal } from '../components/OnboardingModal';
import { SettingsModal } from '../components/SettingsModal';
import { LEVELS } from '../data/levels';
import type { LevelResult } from '../game/types/game';
import type { GameModeId } from '../game/types/mode';
import { addLeaderboardEntry, clearLeaderboard, loadProfile, normalizePlayerName, recordLevelResult, updatePreferences, updateSettings, type PlayerPreferences, type UserSettings } from '../services/storageService';
import styles from './App.module.css';
import { t } from '../services/i18n';

type Screen = 'menu' | 'modes' | 'game' | 'leaderboard' | 'info';
export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [profile, setProfile] = useState(loadProfile);
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0]?.id ?? '');
  const [selectedMode, setSelectedMode] = useState<GameModeId>('campaign');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [tutorialRequested, setTutorialRequested] = useState(false);
  const sessionStartedAt = useRef(Date.now());
  useEffect(() => { document.documentElement.dataset.theme = profile.settings.theme; document.documentElement.dataset.palette = profile.settings.meetingPalette; document.documentElement.lang = profile.settings.language; }, [profile.settings]);
  const beginPlay = () => profile.preferences.playerName ? setScreen('modes') : setOnboardingOpen(true);
  const completeOnboarding = (preferences: PlayerPreferences, tutorial: boolean) => { setProfile((current) => updatePreferences(current, preferences)); setOnboardingOpen(false); setTutorialRequested(tutorial); setScreen('modes'); };
  const saveSettings = (settings: UserSettings, preferences: PlayerPreferences) => { const safeName = preferences.playerName ? normalizePlayerName(preferences.playerName) : null; setProfile((current) => updatePreferences(updateSettings(current, settings), { ...preferences, playerName: safeName ?? current.preferences.playerName })); setSettingsOpen(false); };
  const saveResult = (result: LevelResult) => setProfile((current) => { const withProgress = recordLevelResult(current, result, undefined, selectedLevelId); return addLeaderboardEntry(withProgress, { id: crypto.randomUUID(), playerName: current.preferences.playerName ?? 'Игрок', mode: selectedMode, score: result.score, freedMinutes: result.freedMinutes, destroyedMeetings: result.destroyedMeetings, maxCombo: result.maxCombo, durationSeconds: Math.max(1, Math.round((Date.now() - sessionStartedAt.current) / 1000)), createdAt: new Date().toISOString() }); });
  const launchMode = (mode: GameModeId) => { sessionStartedAt.current = Date.now(); setSelectedMode(mode); setScreen('game'); };
  return <main className={`${styles.appShell} ${screen === 'game' ? styles.gameShell : styles.menuShell}`}>
    <header className={styles.header}><p className={styles.eyebrow}>Дай календарю пизды</p><h1>Meeting Breaker</h1><p className={styles.subtitle}>{t(profile.settings.language, 'app.subtitle')}</p></header>
    {screen === 'menu' && <MainMenu levels={LEVELS} selectedLevelId={selectedLevelId} progress={profile.progress} playerName={profile.preferences.playerName} language={profile.settings.language} onSelectLevel={setSelectedLevelId} onStart={beginPlay} onLeaderboard={() => setScreen('leaderboard')} onOpenSettings={() => setSettingsOpen(true)} onInfo={() => setScreen('info')} />}
    {screen === 'modes' && <ModeSelect onSelect={launchMode} onBack={() => setScreen('menu')} />}
    {screen === 'leaderboard' && <Leaderboard entries={profile.leaderboard} onClear={() => setProfile((current) => clearLeaderboard(current))} onBack={() => setScreen('menu')} />}
    {screen === 'info' && <InfoScreen onTutorial={() => { setTutorialRequested(true); setScreen('modes'); }} onBack={() => setScreen('menu')} />}
    {screen === 'game' && <GameCanvas settings={profile.settings} mode={selectedMode} tutorial={tutorialRequested} levelId={selectedLevelId} onExitToMenu={() => { setTutorialRequested(false); setScreen('menu'); }} onLevelResult={saveResult} />}
    {settingsOpen && <SettingsModal settings={profile.settings} preferences={profile.preferences} onSave={saveSettings} onTutorial={() => { setSettingsOpen(false); setTutorialRequested(true); setScreen('modes'); }} onClose={() => setSettingsOpen(false)} />}
    {onboardingOpen && <OnboardingModal preferences={profile.preferences} onComplete={completeOnboarding} onClose={() => setOnboardingOpen(false)} />}
  </main>;
}
