import { useEffect, useRef, useState } from 'react';
import { GameCanvas } from '../components/GameCanvas';
import { CampaignSelect } from '../components/CampaignSelect';
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
import { ControlSchemeModal } from '../components/ControlSchemeModal';
import type { ControlScheme } from '../services/storageService';

type Screen = 'menu' | 'modes' | 'campaign' | 'game';
export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [profile, setProfile] = useState(loadProfile);
  const [selectedLevelId, setSelectedLevelId] = useState(LEVELS[0]?.id ?? '');
  const [selectedMode, setSelectedMode] = useState<GameModeId>('campaign');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [controlSchemeOpen, setControlSchemeOpen] = useState(false);
  const [controlDestination, setControlDestination] = useState<'modes' | 'tutorial'>('modes');
  const [tutorialRequested, setTutorialRequested] = useState(false);
  const sessionStartedAt = useRef(Date.now());
  useEffect(() => { document.documentElement.dataset.theme = profile.settings.theme; document.documentElement.dataset.palette = profile.settings.meetingPalette; document.documentElement.lang = profile.settings.language; }, [profile.settings]);
  const beginPlay = () => {
    if (!profile.preferences.playerName) setOnboardingOpen(true);
    else if (!profile.preferences.controlScheme) { setControlDestination('modes'); setControlSchemeOpen(true); }
    else setScreen('modes');
  };
  const selectControlScheme = (controlScheme: ControlScheme) => {
    setProfile((current) => updatePreferences(current, { controlScheme }));
    setControlSchemeOpen(false);
    if (controlDestination === 'tutorial') {
      setSelectedMode('campaign'); setTutorialRequested(true); sessionStartedAt.current = Date.now(); setScreen('game');
    } else setScreen('modes');
  };
  const launchTutorial = () => {
    setSelectedMode('campaign');
    setTutorialRequested(true);
    sessionStartedAt.current = Date.now();
    if (!profile.preferences.controlScheme) { setControlDestination('tutorial'); setControlSchemeOpen(true); }
    else setScreen('game');
  };
  const completeOnboarding = (preferences: PlayerPreferences, tutorial: boolean) => { setProfile((current) => updatePreferences(current, preferences)); setOnboardingOpen(false); setTutorialRequested(tutorial); setSelectedMode('campaign'); sessionStartedAt.current = Date.now(); setScreen(tutorial ? 'game' : 'modes'); };
  const saveSettings = (settings: UserSettings, preferences: PlayerPreferences) => { const safeName = preferences.playerName ? normalizePlayerName(preferences.playerName) : null; setProfile((current) => updatePreferences(updateSettings(current, settings), { ...preferences, playerName: safeName ?? current.preferences.playerName })); setSettingsOpen(false); };
  const saveResult = (result: LevelResult) => setProfile((current) => { const completedProfile = tutorialRequested ? updatePreferences(current, { tutorialCompleted: true }) : recordLevelResult(current, result, undefined, selectedLevelId); return addLeaderboardEntry(completedProfile, { id: crypto.randomUUID(), playerName: current.preferences.playerName ?? 'Игрок', mode: selectedMode, score: result.score, freedMinutes: result.freedMinutes, destroyedMeetings: result.destroyedMeetings, maxCombo: result.maxCombo, durationSeconds: Math.max(1, Math.round((Date.now() - sessionStartedAt.current) / 1000)), createdAt: new Date().toISOString() }); });
  const launchMode = (mode: GameModeId) => { setSelectedMode(mode); if (mode === 'campaign') { setScreen('campaign'); return; } sessionStartedAt.current = Date.now(); setScreen('game'); };
  const launchCampaignLevel = () => { sessionStartedAt.current = Date.now(); setSelectedMode('campaign'); setScreen('game'); };
  const goToNextLevel = () => {
    const currentIndex = LEVELS.findIndex((level) => level.id === selectedLevelId);
    const nextLevel = currentIndex >= 0 ? LEVELS[currentIndex + 1] : undefined;
    if (!nextLevel) { setScreen('menu'); return; }
    setSelectedLevelId(nextLevel.id);
    setTutorialRequested(false);
    sessionStartedAt.current = Date.now();
  };
  return <main className={`${styles.appShell} ${screen === 'game' ? styles.gameShell : styles.menuShell}`}>
    <header className={styles.header}><p className={styles.eyebrow}>{t(profile.settings.language, 'app.eyebrow')}</p><h1>Meeting Breaker</h1><p className={styles.subtitle}>{t(profile.settings.language, 'app.subtitle')}</p></header>
    {screen === 'menu' && <MainMenu progress={profile.progress} playerName={profile.preferences.playerName} language={profile.settings.language} onStart={beginPlay} onLeaderboard={() => setLeaderboardOpen(true)} onOpenSettings={() => setSettingsOpen(true)} onInfo={() => setInfoOpen(true)} />}
    {screen === 'modes' && <ModeSelect language={profile.settings.language} onSelect={launchMode} onBack={() => setScreen('menu')} />}
    {screen === 'campaign' && <CampaignSelect language={profile.settings.language} levels={LEVELS} progress={profile.progress} selectedLevelId={selectedLevelId} onSelectLevel={setSelectedLevelId} onStart={launchCampaignLevel} onBack={() => setScreen('modes')} />}
    {screen === 'game' && profile.preferences.controlScheme && <GameCanvas settings={profile.settings} controlScheme={profile.preferences.controlScheme} mode={selectedMode} tutorial={tutorialRequested} levelId={selectedLevelId} onExitToMenu={() => { setTutorialRequested(false); setScreen('menu'); }} onLevelResult={saveResult} onNextLevel={goToNextLevel} onTutorialComplete={() => setProfile((current) => updatePreferences(current, { tutorialCompleted: true }))} />}
    {settingsOpen && <SettingsModal settings={profile.settings} preferences={profile.preferences} onSave={saveSettings} onTutorial={() => { setSettingsOpen(false); launchTutorial(); }} onClose={() => setSettingsOpen(false)} />}
    {leaderboardOpen && <Leaderboard language={profile.settings.language} entries={profile.leaderboard} onClear={() => setProfile((current) => clearLeaderboard(current))} onClose={() => setLeaderboardOpen(false)} />}
    {infoOpen && <InfoScreen language={profile.settings.language} onTutorial={() => { setInfoOpen(false); launchTutorial(); }} onClose={() => setInfoOpen(false)} />}
    {onboardingOpen && <OnboardingModal language={profile.settings.language} preferences={profile.preferences} onComplete={completeOnboarding} onClose={() => setOnboardingOpen(false)} />}
    {controlSchemeOpen && <ControlSchemeModal language={profile.settings.language} onSelect={selectControlScheme} />}
  </main>;
}
